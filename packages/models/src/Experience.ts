import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IExperience extends Document {
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  description: string;
  technologies: string[];
  location?: string;
  companyLogoUrl?: string;
  order: number;
}

const ExperienceSchema = new Schema<IExperience>(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    location: String,
    companyLogoUrl: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ExperienceSchema.index({ startDate: -1 });

export default (models.Experience as Model<IExperience>) || model<IExperience>("Experience", ExperienceSchema);
