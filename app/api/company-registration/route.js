import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireApiUser } from '@/lib/auth';
import CompanyRegistration from '@/lib/models/CompanyRegistration';

const DEFAULT_REGISTRATION = {
  companyName: '',
  registrationNumber: '',
  taxId: '',
  businessType: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  country: '',
  status: 'draft',
  submittedAt: null,
  approvedAt: null,
  rejectedAt: null,
  reviewNotes: '',
};

function sanitizeRegistration(body = {}) {
  return {
    companyName: body.companyName || '',
    registrationNumber: body.registrationNumber || '',
    taxId: body.taxId || '',
    businessType: body.businessType || '',
    email: body.email || '',
    phone: body.phone || '',
    website: body.website || '',
    address: body.address || '',
    country: body.country || '',
  };
}

async function getOrCreate(ownerId) {
  let registration = await CompanyRegistration.findOne({ owner: ownerId });
  if (!registration) {
    registration = await CompanyRegistration.create({ owner: ownerId, ...DEFAULT_REGISTRATION });
  }
  return registration;
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const registration = await getOrCreate(user._id);
  return NextResponse.json(registration);
}

export async function PUT(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const body = await request.json();

  const current = await getOrCreate(user._id);
  if (current.status === 'approved') {
    return NextResponse.json(
      { error: 'Registration already approved. Contact admin to update details.' },
      { status: 409 }
    );
  }

  const update = sanitizeRegistration(body);
  const registration = await CompanyRegistration.findOneAndUpdate(
    { owner: user._id },
    { $set: { ...update, status: 'draft' } },
    { new: true, upsert: true }
  );

  return NextResponse.json(registration);
}

export async function POST() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const registration = await getOrCreate(user._id);

  if (registration.status === 'approved') {
    return NextResponse.json(
      { error: 'Registration already approved.' },
      { status: 409 }
    );
  }

  const requiredFields = ['companyName', 'registrationNumber', 'email', 'address', 'country'];
  const missing = requiredFields.filter((field) => !String(registration[field] || '').trim());

  if (missing.length) {
    return NextResponse.json(
      { error: `Please complete required fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  registration.status = 'submitted';
  registration.submittedAt = new Date();
  registration.rejectedAt = null;
  registration.reviewNotes = '';
  await registration.save();

  return NextResponse.json(registration);
}
