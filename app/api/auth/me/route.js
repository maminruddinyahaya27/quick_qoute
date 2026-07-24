import { NextResponse } from 'next/server';
import { getSessionUser, userPayload } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: userPayload(user) });
}
