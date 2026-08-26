import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IChatLog extends Document {
  sessionId: string;
  question: string;
  answer: string;
  toolsUsed: string[];
  latencyMs?: number;
  createdAt: Date;
}

const ChatLogSchema = new Schema<IChatLog>(
  {
    sessionId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    toolsUsed: [{ type: String }],
    latencyMs: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Usado por el dashboard para "preguntas frecuentes" (agregación por texto normalizado)
ChatLogSchema.index({ createdAt: -1 });

export default (models.ChatLog as Model<IChatLog>) || model<IChatLog>("ChatLog", ChatLogSchema);
