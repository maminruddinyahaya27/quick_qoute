import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['quotation', 'invoice', 'receipt'], required: true },
    number: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    items: { type: [ItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'paid', 'overdue'],
      default: 'draft',
    },
    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    convertedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    convertedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  },
  { timestamps: true }
);

DocumentSchema.index({ owner: 1, number: 1 }, { unique: true });

const existingDocumentModel = mongoose.models.Document;
if (existingDocumentModel && !existingDocumentModel.schema.path('type')?.enumValues?.includes('receipt')) {
  delete mongoose.models.Document;
}

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
