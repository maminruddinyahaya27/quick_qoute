import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'systemadmin'], default: 'user' },
  },
  { timestamps: true }
);

const existingUserModel = mongoose.models.User;
if (existingUserModel && !existingUserModel.schema.path('role')) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
