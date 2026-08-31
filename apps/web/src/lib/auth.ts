import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { AdminUser } from "@portafolio/models";
import { checkRateLimit, getClientIpFromHeaderObject } from "./rate-limit";
import { buildTotp } from "./totp";

const LOCKOUT_THRESHOLD = 5; // intentos fallidos consecutivos
const LOCKOUT_MS = 15 * 60_000;

/**
 * Dashboard de un solo administrador (el dueño del portafolio).
 * Las credenciales viven en la colección AdminUser (password hasheado con bcrypt),
 * no en variables de entorno, para poder rotarlas desde un script sin redeploy.
 *
 * Capas de defensa contra fuerza bruta, en orden:
 * 1. Rate limit por IP (checkRateLimit) — frena scripts automatizados.
 * 2. Bloqueo de cuenta tras LOCKOUT_THRESHOLD fallos seguidos — frena a
 *    quien rota de IP, a costa de poder auto-bloquear al dueño real por un
 *    rato si se equivoca varias veces (trade-off aceptado: 15 min).
 * 3. 2FA (TOTP) opcional — si el dueño lo activó desde /admin/seguridad,
 *    el password correcto ya no alcanza para entrar.
 *
 * Los mensajes de error son deliberadamente genéricos hacia afuera ("Credenciales
 * inválidas") salvo el caso "hace falta el código 2FA", que el login
 * necesita distinguir para mostrar el segundo paso del formulario.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 }, // 12h, no el default de 30 días
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        otp: { label: "Código 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = getClientIpFromHeaderObject(req.headers);
        const { allowed } = checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
        if (!allowed) throw new Error("Demasiados intentos. Esperá unos minutos.");

        await connectDB();
        const user = await AdminUser.findOne({ email: credentials.email.toLowerCase() }).select("+totpSecret");
        if (!user) return null; // no revelamos si el email existe o no

        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          throw new Error("Cuenta bloqueada temporalmente por varios intentos fallidos. Probá en unos minutos.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          user.failedLoginAttempts += 1;
          if (user.failedLoginAttempts >= LOCKOUT_THRESHOLD) {
            user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
          }
          await user.save();
          return null;
        }

        if (user.totpEnabled) {
          if (!credentials.otp) throw new Error("OTP_REQUIRED");
          const totp = buildTotp(user.totpSecret!);
          const delta = totp.validate({ token: credentials.otp, window: 1 });
          if (delta === null) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= LOCKOUT_THRESHOLD) {
              user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
            }
            await user.save();
            throw new Error("Código 2FA inválido.");
          }
        }

        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;
        await user.save();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.uid as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
