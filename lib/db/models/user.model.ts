import { IUserInput, ShippingAddress } from '@/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface IUser extends Document, IUserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  shippingAddress?: ShippingAddress
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'User' },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    shippingAddress: { type: Object, required: false },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpires: { type: Date },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    backupCodes: { type: [String] },
  },
  {
    timestamps: true,
  }
)

const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema)

export default User
