import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IGalleryItem extends Document {
  title?: string;
  imageUrl: string;
  caption?: string;
  tags: string[];
  order: number;
}

const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    title: String,
    imageUrl: { type: String, required: true },
    caption: String,
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default (models.GalleryItem as Model<IGalleryItem>) || model<IGalleryItem>("GalleryItem", GalleryItemSchema);
