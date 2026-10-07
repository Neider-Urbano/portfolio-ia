import { Schema, model, models, type Document, type Model } from "mongoose";

export type ChatChannel = "public" | "private";

export interface IChatLog extends Document {
  sessionId: string;
  // Qué chat originó el turno: el público del sitio (/chat) o el privado del
  // dueño (/admin/copiloto). Comparten sessionId (mismo localStorage), así que
  // este campo es lo que mantiene los dos historiales separados.
  channel: ChatChannel;
  question: string;
  answer: string;
  toolsUsed: string[];
  latencyMs?: number;
  // Trazabilidad del turno: qué proveedor/modelo respondió (deja constancia
  // cuando la cadena de fallback se dispara) y cuántos tokens costó. El campo
  // se llama llmModel y no `model` porque Document de mongoose ya define
  // `model()` y la interfaz chocaría.
  provider?: string;
  llmModel?: string;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: Date;
}

const ChatLogSchema = new Schema<IChatLog>(
  {
    sessionId: { type: String, required: true, index: true },
    channel: { type: String, enum: ["public", "private"], default: "public", required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    toolsUsed: [{ type: String }],
    latencyMs: Number,
    provider: String,
    llmModel: String,
    inputTokens: Number,
    outputTokens: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Usado por el dashboard para "preguntas frecuentes" (agregación por texto normalizado)
ChatLogSchema.index({ createdAt: -1 });
// Reconstrucción del historial server-side en /api/chat: últimos turnos de una
// sesión, solo del canal correspondiente.
ChatLogSchema.index({ sessionId: 1, channel: 1, createdAt: -1 });

export default (models.ChatLog as Model<IChatLog>) || model<IChatLog>("ChatLog", ChatLogSchema);
