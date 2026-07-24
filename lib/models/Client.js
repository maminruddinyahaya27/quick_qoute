import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    companyRegistrationNumber: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    addressLine1: { type: String, default: '', trim: true },
    addressLine2: { type: String, default: '', trim: true },
    addressLine3: { type: String, default: '', trim: true },
    postcode: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    address: { type: String, trim: true },
    taxId: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

const existingClientModel = mongoose.models.Client;
if (
  existingClientModel &&
  (!existingClientModel.schema.path('addressLine1') ||
    !existingClientModel.schema.path('state'))
) {
  delete mongoose.models.Client;
}

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
