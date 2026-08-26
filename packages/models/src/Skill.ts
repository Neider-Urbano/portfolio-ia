import { Schema, model, models, type Document, type Model } from "mongoose";

export type SkillCategory = "language" | "framework" | "tool" | "database" | "soft-skill" | "other";

export interface ISkill extends Document {
  name: string;
  category: SkillCategory;
  proficiency: number; // 1-100
  yearsOfExperience?: number;
  iconUrl?: string;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["language", "framework", "tool", "database", "soft-skill", "other"],
      default: "other",
    },
    proficiency: { type: Number, min: 1, max: 100, default: 50 },
    yearsOfExperience: Number,
    iconUrl: String,
  },
  { timestamps: true }
);

export default (models.Skill as Model<ISkill>) || model<ISkill>("Skill", SkillSchema);
