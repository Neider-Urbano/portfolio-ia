import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * Preferencias personales — deliberadamente separadas de Profile en su
 * propia colección. Es la única forma en que "esto nunca sale al público"
 * queda garantizado por arquitectura y no solo por acordarse de excluir
 * campos: ningún endpoint público, /cv, ni tool MCP importa este modelo.
 * Solo /admin/preferencias (protegido por NextAuth) lo lee y lo escribe.
 */
export interface IPreference extends Document {
  favoriteFootballTeams: string[];
  favoriteMusicGenres: string[];
  favoriteFoods: string[];
  maritalStatus?: string;
  socioeconomicStratum?: number;
  desiredSalary?: string;
  prefersRemoteWork?: boolean;
  dailyTools: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PreferenceSchema = new Schema<IPreference>(
  {
    favoriteFootballTeams: [{ type: String }],
    favoriteMusicGenres: [{ type: String }],
    favoriteFoods: [{ type: String }],
    maritalStatus: String,
    socioeconomicStratum: { type: Number, min: 1, max: 6 },
    desiredSalary: String,
    prefersRemoteWork: Boolean,
    dailyTools: [{ type: String }],
  },
  { timestamps: true }
);

// Documento único (singleton), igual que Profile.
export default (models.Preference as Model<IPreference>) || model<IPreference>("Preference", PreferenceSchema);
