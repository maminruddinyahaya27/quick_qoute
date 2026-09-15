import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, requireApiUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  const currentUser = await requireApiUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (currentUser.role !== 'systemadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user.' }, { status: 400 });
  }

  const body = await request.json();
  const newPassword = String(body.newPassword || '');
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { passwordHash: hashPassword(newPassword) } },
    { new: true, select: 'name email' }
  );

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  return NextResponse.json({ success: true, user: { id: String(user._id), name: user.name, email: user.email } });
}
