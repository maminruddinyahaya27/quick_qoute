import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import '@/lib/models/Client';
import { computeTotals } from '@/lib/calc';
import { requireApiUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const doc = await Document.findOne({ _id: id, owner: user._id }).populate('client');
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const { items, taxRate, discount } = body;

  let update = { ...body };

  if (items) {
    const preparedItems = items.map((it) => ({
      description: it.description,
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    }));
    const totals = computeTotals(preparedItems, taxRate || 0, discount || 0);
    update = { ...update, items: preparedItems, ...totals };
  }

  const doc = await Document.findOneAndUpdate({ _id: id, owner: user._id }, update, { new: true }).populate(
    'client'
  );
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const doc = await Document.findOneAndDelete({ _id: id, owner: user._id });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
