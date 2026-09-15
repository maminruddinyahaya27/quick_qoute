import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireApiUser, userPayload } from '@/lib/auth';

export async function GET() {
  const currentUser = await requireApiUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (currentUser.role !== 'systemadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();
  const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users: users.map(userPayload) });
}
