import fs from 'fs';
import mongoose from 'mongoose';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const match = envText.match(/^MONGODB_URI=(.*)$/m);
const uri = match ? match[1].trim() : '';

if (!uri) {
  throw new Error('MONGODB_URI is not set in .env.local');
}

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

function hasAddressKeys(doc = {}) {
  return [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'postcode',
    'city',
    'state',
    'country',
  ].every((key) => Object.prototype.hasOwnProperty.call(doc, key));
}

async function migrateCollection(collection) {
  let migrated = 0;

  for await (const doc of collection.find({})) {
    if (hasAddressKeys(doc)) continue;
    const parsed = parseAddress(doc.address || '');
    await collection.updateOne(
      { _id: doc._id },
      { $set: parsed, $unset: { address: '' } }
    );
    migrated += 1;
  }

  return migrated;
}

await mongoose.connect(uri, { bufferCommands: false });
const db = mongoose.connection.db;

const migratedClients = await migrateCollection(db.collection('clients'));
const migratedMyDetails = await migrateCollection(db.collection('mydetails'));

console.log(JSON.stringify({ migratedClients, migratedMyDetails }, null, 2));

await mongoose.disconnect();
