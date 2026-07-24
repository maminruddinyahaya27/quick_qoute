import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import { nextSequence } from '@/lib/models/Counter';
import '@/lib/models/Client';
import { requireApiUser } from '@/lib/auth';

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function POST(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const quotation = await Document.findOne({ _id: id, owner: user._id });
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quotation.type !== 'quotation') {
    return NextResponse.json({ error: 'Only quotations can be converted' }, { status: 400 });
  }

  if (quotation.convertedTo) {
    const existing = await Document.findOne({ _id: quotation.convertedTo, owner: user._id }).populate('client');
    return NextResponse.json(existing);
  }

  const seq = await nextSequence('document', user._id);
  const number = `${todayStamp()}-${String(seq).padStart(5, '0')}`;

  const invoice = await Document.create({
    owner: user._id,
    type: 'invoice',
    number,
    client: quotation.client,
    items: quotation.items,
    subtotal: quotation.subtotal,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    discount: quotation.discount,
    total: quotation.total,
    notes: quotation.notes,
    termsAndConditions: quotation.termsAndConditions,
    status: 'draft',
    dueDate: quotation.dueDate,
    convertedFrom: quotation._id,
  });

  quotation.convertedTo = invoice._id;
  quotation.status = 'accepted';
  await quotation.save();

  const populated = await invoice.populate('client');
  return NextResponse.json(populated, { status: 201 });
}
