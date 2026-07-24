import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, required: true }, // e.g. 'document'
  seq: { type: Number, default: 0 },
});

CounterSchema.index({ owner: 1, key: 1 }, { unique: true });

const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

export async function nextSequence(key, ownerId) {
  const doc = await Counter.findOneAndUpdate(
    { key, owner: ownerId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
