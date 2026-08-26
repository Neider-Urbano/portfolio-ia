import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IProfile extends Document {
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  location?: string;
  email: string;
  phone?: string;
  yearsOfExperience: number;
  socialLinks: { platform: string; url: string }[];
  resumeUrl?: string;
  aiPersona?: string; // instrucciones de tono/estilo que el LLM debe usar al "ser" este perfil
  birthDate?: Date; // privado: solo se expone la edad calculada, nunca esta fecha
  hobbies: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    fullName: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String, required: true },
    avatarUrl: String,
    location: String,
    email: { type: String, required: true },
    phone: String,
    yearsOfExperience: { type: Number, default: 0 },
    socialLinks: [
      {
        _id: false,
        platform: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    resumeUrl: String,
    aiPersona: String,
    birthDate: Date,
    hobbies: [{ type: String }],
  },
  { timestamps: true }
);

// Debe existir un único documento de Perfil (singleton lógico gestionado desde el dashboard)
export default (models.Profile as Model<IProfile>) || model<IProfile>("Profile", ProfileSchema);
