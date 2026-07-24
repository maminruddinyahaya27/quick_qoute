import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  destroySessionByToken,
} from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySessionByToken(token);
  }

  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
