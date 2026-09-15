import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import {
  createSession,
  ensureSuperadmin,
  setSessionCookie,
  userPayload,
  verifyPassword,
} from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await ensureSuperadmin();
    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user._id);
    const response = NextResponse.json({ user: userPayload(user) });
    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error('Login failed because the database is unavailable.', error);
    return NextResponse.json(
      { error: 'Database connection failed. Check MONGODB_URI and MongoDB network access.' },
      { status: 503 }
    );
  }
}
