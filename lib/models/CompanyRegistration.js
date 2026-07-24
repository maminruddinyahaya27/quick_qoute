import mongoose from 'mongoose';

const CompanyRegistrationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    taxId: { type: String, default: '' },
    businessType: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    country: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default
  mongoose.models.CompanyRegistration ||
  mongoose.model('CompanyRegistration', CompanyRegistrationSchema);
