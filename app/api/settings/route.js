import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Setting from '@/lib/models/Setting';
import { requireApiUser } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  key: 'default',
  quotationValidityDays: 30,
  quotationTermsAndConditions: '',
  quotationHeader: {
    enabled: false,
    title: '',
    subtitle: '',
    note: '',
  },
};

async function ensureSettingIndexes() {
  try {
    const indexes = await Setting.collection.indexes();
    const hasLegacyKeyIndex = indexes.some((idx) => idx.name === 'key_1' && idx.unique);

    if (hasLegacyKeyIndex) {
      await Setting.collection.dropIndex('key_1');
    }

    const hasOwnerKeyIndex = indexes.some(
      (idx) => idx.name === 'owner_1_key_1' && idx.unique
    );
    if (!hasOwnerKeyIndex) {
      await Setting.collection.createIndex({ owner: 1, key: 1 }, { unique: true });
    }
  } catch (error) {
    if (error?.codeName === 'NamespaceNotFound') return;
    throw error;
  }
}

async function getOrCreateSettings() {
  const user = await requireApiUser();
  if (!user) return null;

  let settings = await Setting.findOne({ owner: user._id, key: 'default' });
  if (!settings) {
    settings = await Setting.create({ ...DEFAULT_SETTINGS, owner: user._id });
  }
  return settings;
}

export async function GET() {
  await dbConnect();
  await ensureSettingIndexes();
  const settings = await getOrCreateSettings();
  if (!settings) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  await ensureSettingIndexes();
  const body = await request.json();

  const update = {};
  if (typeof body.quotationValidityDays !== 'undefined') {
    const value = Number(body.quotationValidityDays);
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json(
        { error: 'quotationValidityDays must be a non-negative number' },
        { status: 400 }
      );
    }
    update.quotationValidityDays = value;
  }

  if (typeof body.quotationTermsAndConditions === 'string') {
    update.quotationTermsAndConditions = body.quotationTermsAndConditions;
  }

  if (typeof body.quotationHeader !== 'undefined') {
    const header = body.quotationHeader || {};
    update.quotationHeader = {
      enabled: Boolean(header.enabled),
      title: typeof header.title === 'string' ? header.title : '',
      subtitle: typeof header.subtitle === 'string' ? header.subtitle : '',
      note: typeof header.note === 'string' ? header.note : '',
    };
  }

  const settings = await Setting.findOneAndUpdate(
    { owner: user._id, key: 'default' },
    { $set: update, $setOnInsert: { owner: user._id, key: 'default' } },
    { new: true, upsert: true }
  );

  return NextResponse.json(settings);
}
