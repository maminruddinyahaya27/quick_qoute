import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireApiUser } from '@/lib/auth';
import MyDetail from '@/lib/models/MyDetail';
import Setting from '@/lib/models/Setting';

const EMPTY_DETAILS = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postcode: '',
  city: '',
  state: '',
  country: '',
  address: '',
  website: '',
  taxId: '',
};

function parseAddress(address = '') {
  const lines = String(address)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasLocationLine = lines.length > 1;
  const location = hasLocationLine ? lines[lines.length - 1] : '';
  const locationParts = location.split(',').map((part) => part.trim()).filter(Boolean);

  return {
    addressLine1: hasLocationLine ? lines[0] || '' : lines[0] || '',
    addressLine2: hasLocationLine ? lines[1] || '' : '',
    addressLine3: hasLocationLine ? lines[2] || '' : '',
    postcode: locationParts[0] || '',
    city: locationParts[1] || '',
    state: locationParts[2] || '',
    country: locationParts[3] || '',
  };
}

function sanitizeMyDetails(body = {}) {
  const legacyAddressFields = parseAddress(body.address);
  return {
    businessName: body.businessName || '',
    contactName: body.contactName || '',
    email: body.email || '',
    phone: body.phone || '',
    addressLine1: body.addressLine1 || legacyAddressFields.addressLine1 || '',
    addressLine2: body.addressLine2 || legacyAddressFields.addressLine2 || '',
    addressLine3: body.addressLine3 || legacyAddressFields.addressLine3 || '',
    postcode: body.postcode || legacyAddressFields.postcode || '',
    city: body.city || legacyAddressFields.city || '',
    state: body.state || legacyAddressFields.state || '',
    country: body.country || legacyAddressFields.country || '',
    website: body.website || '',
    taxId: body.taxId || '',
  };
}

function hasStructuredAddress(detail = {}) {
  return [
    detail.addressLine1,
    detail.addressLine2,
    detail.addressLine3,
    detail.postcode,
    detail.city,
    detail.state,
    detail.country,
  ].some(Boolean);
}

function hasAddressKeys(detail = {}) {
  return [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'postcode',
    'city',
    'state',
    'country',
  ].every((key) => Object.prototype.hasOwnProperty.call(detail, key));
}

async function migrateMyDetail(detail) {
  const source = detail?.toObject ? detail.toObject() : detail;
  if (hasAddressKeys(source)) return detail;

  const parsed = parseAddress(detail.address || '');
  await MyDetail.updateOne({ _id: detail._id }, { $set: parsed, $unset: { address: 1 } });
  Object.assign(detail, parsed, { address: undefined });
  return detail;
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();

  let detail = await MyDetail.findOne({ owner: user._id });

  if (!detail) {
    const oldSettings = await Setting.findOne({ owner: user._id, key: 'default' });
    const migrated = oldSettings?.myDetails ? sanitizeMyDetails(oldSettings.myDetails) : EMPTY_DETAILS;
    detail = await MyDetail.create({ owner: user._id, ...migrated });
  }

  await migrateMyDetail(detail);

  return NextResponse.json(detail);
}

export async function PUT(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();
  const myDetails = sanitizeMyDetails(body);

  const detail = await MyDetail.findOneAndUpdate(
    { owner: user._id },
    { $set: myDetails, $unset: { address: 1 }, $setOnInsert: { owner: user._id } },
    { new: true, upsert: true }
  );

  return NextResponse.json(detail);
}
