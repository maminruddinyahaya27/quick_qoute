import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Document from '@/lib/models/Document';
import Client from '@/lib/models/Client';
import { nextSequence } from '@/lib/models/Counter';
import '@/lib/models/Client'; // ensure schema is registered for populate()
import { computeTotals } from '@/lib/calc';
import { requireApiUser } from '@/lib/auth';

const VALID_TYPES = new Set(['quotation', 'invoice', 'receipt']);

function todayStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function GET(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const filter = { owner: user._id, ...(type ? { type } : {}) };
  const docs = await Document.find(filter).populate('client').sort({ createdAt: -1 });
  return NextResponse.json(docs);
}

export async function POST(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const {
    type,
    client,
    items = [],
    taxRate = 0,
    discount = 0,
    notes = '',
    termsAndConditions = '',
    dueDate,
    issueDate,
  } = body;

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  }
  if (!client) {
    return NextResponse.json({ error: 'Client is required' }, { status: 400 });
  }
  const clientDoc = await Client.findOne({ _id: client, owner: user._id });
  if (!clientDoc) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  if (!items.length) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
  }

  const seq = await nextSequence('document', user._id);
  const number = `${todayStamp()}-${String(seq).padStart(5, '0')}`;

  const preparedItems = items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity) || 0,
    rate: Number(it.rate) || 0,
    amount: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
  }));
  const totals = computeTotals(preparedItems, taxRate, discount);

  const doc = await Document.create({
    owner: user._id,
    type,
    number,
    client,
    items: preparedItems,
    taxRate,
    discount,
    notes,
    termsAndConditions,
    issueDate: issueDate || new Date(),
    dueDate: dueDate || null,
    ...totals,
  });

  const populated = await doc.populate('client');
  return NextResponse.json(populated, { status: 201 });
}
