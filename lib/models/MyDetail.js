import mongoose from 'mongoose';

const MyDetailSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, default: '' },
    contactName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine1: { type: String, default: '' },
    addressLine2: { type: String, default: '' },
    addressLine3: { type: String, default: '' },
    postcode: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    address: { type: String },
    website: { type: String, default: '' },
    taxId: { type: String, default: '' },
  },
  { timestamps: true }
);

const existingMyDetailModel = mongoose.models.MyDetail;
if (
  existingMyDetailModel &&
  !existingMyDetailModel.schema.path('addressLine1')
) {
  delete mongoose.models.MyDetail;
}

export default mongoose.models.MyDetail || mongoose.model('MyDetail', MyDetailSchema);
