import { Schema, model, models, type Document, type Model } from "mongoose";

/**
 * Documentos personales del dueño, cada uno como un link (Drive u otro) —
 * cédula, pase de moto, hojas de vida en distintos idiomas, etc. Reemplaza
 * a Profile.resumeUrl: la(s) hoja(s) de vida ahora son entradas acá con
 * kind:"hoja_vida" e isPublic:true, en vez de un campo fijo del perfil.
 *
 * isPublic es la única frontera entre lo que puede mostrar la home/el chat
 * (getFullProfile()/get_profile_info filtran por isPublic:true, kind:"hoja_vida")
 * y lo que es exclusivamente privado (cédula, pase de moto, ...) — por
 * defecto false, así un documento nuevo nunca se expone por accidente.
 */
export interface IDocumentItem extends Document {
  label: string; // ej. "Cédula de ciudadanía", "Hoja de vida (Español)", "Pase de moto"
  url: string;
  kind: "identidad" | "hoja_vida" | "otro";
  language?: string; // ej. "es" | "en" — solo tiene sentido si kind es "hoja_vida"
  isPublic: boolean;
  // Solo relevante si kind:"hoja_vida" — cuál es "la" hoja de vida (botón "Ver
  // CV" principal en la home) vs. secundarias (ej. la versión en otro
  // idioma). El backend garantiza que como máximo una quede en true (ver
  // apps/web/src/app/api/admin/documents/route.ts).
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentItemSchema = new Schema<IDocumentItem>(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["identidad", "hoja_vida", "otro"], default: "otro" },
    language: { type: String, trim: true },
    isPublic: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DocumentItemSchema.index({ kind: 1, isPublic: 1 });

export default (models.DocumentItem as Model<IDocumentItem>) ||
  model<IDocumentItem>("DocumentItem", DocumentItemSchema);
