import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';

export const SESSION_COOKIE_NAME = 'qip_session';
const SESSION_TTL_DAYS = 14;

function authSecret() {
  return process.env.AUTH_SECRET || 'dev-only-auth-secret-change-me';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  const [salt, key] = String(storedHash || '').split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(derivedKey, 'hex');
  const b = Buffer.from(key, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function tokenHash(token) {
  return crypto.createHmac('sha256', authSecret()).update(token).digest('hex');
}

export async function createSession(userId) {
  await dbConnect();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await Session.create({
    tokenHash: tokenHash(token),
    user: userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySessionByToken(token) {
  if (!token) return;
  await dbConnect();
  await Session.findOneAndDelete({ tokenHash: tokenHash(token) });
}

export async function getSessionUser() {
  await dbConnect();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await Session.findOne({ tokenHash: tokenHash(token) }).populate('user');
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await Session.findByIdAndDelete(session._id);
    return null;
  }

  return session.user || null;
}

export function setSessionCookie(response, token, expiresAt) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function requireApiUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

export function userPayload(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role || 'user',
  };
}
