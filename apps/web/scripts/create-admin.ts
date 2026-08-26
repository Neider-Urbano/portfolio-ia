import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AdminUser } from "@portafolio/models";

/**
 * Crea (o actualiza la contraseña de) el único usuario admin del dashboard.
 * Uso: EMAIL=tu@email.com PASSWORD=algoSeguro npm run create-admin --workspace=apps/web
 */
async function main() {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  const name = process.env.NAME ?? "Admin";

  if (!email || !password) {
    console.error("Debes definir EMAIL y PASSWORD como variables de entorno.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);

  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), passwordHash, name },
    { upsert: true }
  );

  console.log(`Admin listo: ${email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
