import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "owner";
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["owner"], default: "owner" },
  },
  { timestamps: true }
);

export default (models.AdminUser as Model<IAdminUser>) || model<IAdminUser>("AdminUser", AdminUserSchema);
