import { Schema, model, models, type Document, type Model } from "mongoose";

export type AnalyticsEventType =
  | "page_view"
  | "project_view"
  | "chat_question"
  | "resume_download"
  | "contact_message";

export interface IAnalyticsEvent extends Document {
  type: AnalyticsEventType;
  path?: string;
  projectSlug?: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
  userAgent?: string;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      enum: ["page_view", "project_view", "chat_question", "resume_download", "contact_message"],
      required: true,
    },
    path: String,
    projectSlug: String,
    metadata: Schema.Types.Mixed,
    sessionId: { type: String, required: true, index: true },
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ projectSlug: 1 });

export default (models.AnalyticsEvent as Model<IAnalyticsEvent>) ||
  model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);
