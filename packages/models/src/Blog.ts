import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * Artículos de blog externos que aportan al perfil profesional del dueño —
 * no son posts propios, es una lista curada de lecturas relevantes. Se
 * registran automáticamente cada cierto tiempo desde una automatización de
 * n8n (vía la tool MCP create_blog) con reviewed:false; el dueño los revisa
 * y cura después desde /admin/blogs.
 */
export interface IBlog extends Document {
  title: string;
  description: string;
  url: string;
  source?: string;
  relevance: number; // 1-10, qué tan relevante es para el perfil profesional
  tags: string[];
  publishedDate?: Date;
  reviewed: boolean; // true una vez que el dueño lo vio/curó desde el admin
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true, unique: true, trim: true },
    source: String,
    relevance: { type: Number, min: 1, max: 10, default: 5 },
    tags: [{ type: String }],
    publishedDate: Date,
    reviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BlogSchema.index({ reviewed: 1, createdAt: -1 });
BlogSchema.index({ tags: 1 });

export default (models.Blog as Model<IBlog>) || model<IBlog>("Blog", BlogSchema);
