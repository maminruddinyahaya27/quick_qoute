import crypto from 'crypto';
import fs from 'fs';
import mongoose from 'mongoose';

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return String(process.argv[index + 1] || '').trim();
}

function readMongoUri() {
  const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const match = envText.match(/^MONGODB_URI=(.*)$/m);
  return match ? match[1].trim() : '';
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

const name = getArg('--name');
const email = getArg('--email').toLowerCase();
const password = getArg('--password');

if (!name || !email || !password) {
  throw new Error('Usage: npm run create:systemadmin -- --name "Admin" --email "admin@example.com" --password "strongpass"');
}

if (password.length < 6) {
  throw new Error('Password must be at least 6 characters.');
}

const uri = readMongoUri();
if (!uri) {
  throw new Error('MONGODB_URI is not set in .env.local');
}

await mongoose.connect(uri, { bufferCommands: false });

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    passwordHash: String,
    role: { type: String, enum: ['user', 'systemadmin'], default: 'user' },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', userSchema);

const existing = await User.findOne({ email });
if (existing) {
  existing.name = name;
  existing.passwordHash = hashPassword(password);
  existing.role = 'systemadmin';
  await existing.save();
  console.log(`Updated existing user ${email} to systemadmin.`);
} else {
  await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'systemadmin',
  });
  console.log(`Created systemadmin user ${email}.`);
}

await mongoose.disconnect();
