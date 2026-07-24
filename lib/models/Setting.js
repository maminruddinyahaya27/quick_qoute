import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true, default: 'default' },
    quotationValidityDays: { type: Number, default: 30 },
    quotationTermsAndConditions: { type: String, default: '' },
    quotationHeader: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    myDetails: {
      businessName: { type: String, default: '' },
      contactName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      website: { type: String, default: '' },
      taxId: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

SettingSchema.index({ owner: 1, key: 1 }, { unique: true });

const existingSettingModel = mongoose.models.Setting;
if (existingSettingModel && !existingSettingModel.schema.path('quotationHeader')) {
  delete mongoose.models.Setting;
}

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
