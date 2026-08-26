import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IService extends Document {
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default (models.Service as Model<IService>) || model<IService>("Service", ServiceSchema);
