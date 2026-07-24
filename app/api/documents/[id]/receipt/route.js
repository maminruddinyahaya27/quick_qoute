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
  const quotation = await Document.findOne({ _id: id, owner: user._id }).populate('client');
  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quotation.type !== 'quotation') {
    return NextResponse.json({ error: 'Only quotations can create receipts' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const notes = String(body.notes || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'A valid deposit amount is required.' }, { status: 400 });
  }

  const seq = await nextSequence('document', user._id);
  const number = `${todayStamp()}-${String(seq).padStart(5, '0')}`;
  const description = `Deposit received for quotation ${quotation.number}`;
  const receiptNotes = [
    notes,
    `Receipt created from quotation ${quotation.number}.`,
  ]
    .filter(Boolean)
    .join('\n');

  const receipt = await Document.create({
    owner: user._id,
    type: 'receipt',
    number,
    client: quotation.client._id,
    items: [
      {
        description,
        quantity: 1,
        rate: amount,
        amount,
      },
    ],
    subtotal: amount,
    discount: 0,
    taxRate: 0,
    taxAmount: 0,
    total: amount,
    notes: receiptNotes,
    termsAndConditions: '',
    status: 'paid',
    issueDate: new Date(),
    dueDate: null,
    convertedFrom: quotation._id,
  });

  const populated = await receipt.populate('client');
  return NextResponse.json(populated, { status: 201 });
}
