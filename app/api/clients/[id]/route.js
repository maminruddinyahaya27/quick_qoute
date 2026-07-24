import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import { requireApiUser } from '@/lib/auth';

function parseAddress(address = '') {
  const lines = String(address)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const location = lines.length > 1 ? lines[lines.length - 1] : '';
  const locationParts = location.split(',').map((part) => part.trim()).filter(Boolean);
  const addressLines = lines.length > 1 ? lines.slice(0, -1) : lines;

  return {
    addressLine1: addressLines[0] || '',
    addressLine2: addressLines[1] || '',
    addressLine3: addressLines[2] || '',
    postcode: locationParts[0] || '',
    city: locationParts[1] || '',
    state: locationParts[2] || '',
    country: locationParts[3] || '',
  };
}

function hasStructuredAddress(data = {}) {
  return [
    data.addressLine1,
    data.addressLine2,
    data.addressLine3,
    data.postcode,
    data.city,
    data.state,
    data.country,
  ].some(Boolean);
}

function normalizeClientPayload(data = {}) {
  const parsed = !hasStructuredAddress(data) && data.address ? parseAddress(data.address) : {};

  return {
    name: String(data.name || '').trim().toUpperCase(),
    company: data.company || '',
    companyRegistrationNumber: data.companyRegistrationNumber || '',
    email: data.email || '',
    phone: data.phone || '',
    addressLine1: data.addressLine1 || parsed.addressLine1 || '',
    addressLine2: data.addressLine2 || parsed.addressLine2 || '',
    addressLine3: data.addressLine3 || parsed.addressLine3 || '',
    postcode: data.postcode || parsed.postcode || '',
    city: data.city || parsed.city || '',
    state: data.state || parsed.state || '',
    country: data.country || parsed.country || '',
    taxId: data.taxId || '',
  };
}

async function migrateClient(client) {
  if (!client?.address || hasStructuredAddress(client)) return client;

  const parsed = parseAddress(client.address);
  await Client.updateOne({ _id: client._id }, { $set: parsed, $unset: { address: 1 } });
  Object.assign(client, parsed, { address: undefined });
  return client;
}

export async function GET(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const client = await Client.findOne({ _id: id, owner: user._id });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await migrateClient(client);
  return NextResponse.json(client);
}

export async function PUT(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const data = await request.json();
  if (!String(data.name || '').trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const client = await Client.findOneAndUpdate(
    { _id: id, owner: user._id },
    { $set: normalizeClientPayload(data), $unset: { address: 1 } },
    { new: true }
  );
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function DELETE(request, { params }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const client = await Client.findOneAndDelete({ _id: id, owner: user._id });
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
