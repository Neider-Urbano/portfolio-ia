import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "owner";
  // Bloqueo por fuerza bruta: se incrementa en cada password incorrecto y se
  // resetea en cada login exitoso (ver lib/auth.ts). lockedUntil solo se
  // fija al llegar al umbral; no se usa para nada más.
  failedLoginAttempts: number;
  lockedUntil?: Date;
  // 2FA (TOTP, tipo Google Authenticator). totpSecret vive en texto plano
  // igual que un password en un .env: el mismo modelo de confianza que
  // passwordHash (acceso a la DB = acceso total de cualquier forma), pero a
  // diferencia del password no puede guardarse hasheado porque hay que
  // volver a calcular el código cada 30s para verificarlo.
  totpSecret?: string;
  totpEnabled: boolean;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["owner"], default: "owner" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (models.AdminUser as Model<IAdminUser>) || model<IAdminUser>("AdminUser", AdminUserSchema);
