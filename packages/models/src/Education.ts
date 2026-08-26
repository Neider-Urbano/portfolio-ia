import { Schema, model, models, type Document, type Model } from "mongoose";

export type EducationType = "degree" | "certification" | "course";

export interface IEducation extends Document {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
  credentialUrl?: string;
  type: EducationType;
  order: number;
}

const EducationSchema = new Schema<IEducation>(
  {
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    isCurrent: { type: Boolean, default: false },
    credentialUrl: String,
    type: { type: String, enum: ["degree", "certification", "course"], default: "degree" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default (models.Education as Model<IEducation>) || model<IEducation>("Education", EducationSchema);
