import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IComment extends Document {
  name: string;
  message: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    name: { type: String, required: true },
    message: { type: String, required: true },
    // A diferencia de Reference (que carga el propio dueño), un comentario lo
    // envía cualquier visitante — no se publica hasta que el dueño lo aprueba
    // desde /admin/comentarios.
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (models.Comment as Model<IComment>) || model<IComment>("Comment", CommentSchema);
