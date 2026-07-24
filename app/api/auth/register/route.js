import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import {
  createSession,
  hashPassword,
  setSessionCookie,
  userPayload,
} from '@/lib/auth';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: 'Email is already registered.' }, { status: 409 });
  }

  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
  });

  const { token, expiresAt } = await createSession(user._id);
  const response = NextResponse.json({ user: userPayload(user) }, { status: 201 });
  setSessionCookie(response, token, expiresAt);
  return response;
}
