import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add it to .env.local (see .env.example).'
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
