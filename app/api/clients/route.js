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

function hasAddressKeys(data = {}) {
  return [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'postcode',
    'city',
    'state',
    'country',
  ].every((key) => Object.prototype.hasOwnProperty.call(data, key));
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

async function migrateClients(clients) {
  await Promise.all(
    clients
      .filter((client) => !hasAddressKeys(client.toObject ? client.toObject() : client))
      .map(async (client) => {
        const parsed = parseAddress(client.address || '');
        await Client.updateOne(
          { _id: client._id },
          { $set: parsed, $unset: { address: 1 } }
        );
        Object.assign(client, parsed, { address: undefined });
      })
  );
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const clients = await Client.find({ owner: user._id }).sort({ createdAt: -1 });
  await migrateClients(clients);
  return NextResponse.json(clients);
}

export async function POST(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const data = await request.json();
  if (!String(data.name || '').trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const client = await Client.create({ ...normalizeClientPayload(data), owner: user._id });
  return NextResponse.json(client, { status: 201 });
}
