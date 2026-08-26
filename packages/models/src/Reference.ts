import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IReference extends Document {
  name: string;
  role: string;
  company?: string;
  relationship: string;
  testimonial: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  isPublished: boolean;
}

const ReferenceSchema = new Schema<IReference>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    company: String,
    relationship: { type: String, required: true },
    testimonial: { type: String, required: true },
    avatarUrl: String,
    linkedinUrl: String,
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default (models.Reference as Model<IReference>) || model<IReference>("Reference", ReferenceSchema);
