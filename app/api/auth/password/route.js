import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, requireApiUser, verifyPassword } from '@/lib/auth';

export async function PUT(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { passwordHash: hashPassword(newPassword) } }
  );

  return NextResponse.json({ success: true });
}
