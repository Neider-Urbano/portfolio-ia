import { Schema, model, models, type Document, type Model } from "mongoose";

export type ProjectStatus = "completed" | "in-progress" | "archived";

export interface IProject extends Document {
  title: string;
  slug: string;
  summary: string;
  description: string;
  technologies: string[];
  images: string[];
  liveUrl?: string;
  repoUrl?: string;
  featured: boolean;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  viewCount: number;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    images: [{ type: String }],
    liveUrl: String,
    repoUrl: String,
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["completed", "in-progress", "archived"], default: "completed" },
    startDate: Date,
    endDate: Date,
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ technologies: 1 });
ProjectSchema.index({ featured: -1, createdAt: -1 });

export default (models.Project as Model<IProject>) || model<IProject>("Project", ProjectSchema);
