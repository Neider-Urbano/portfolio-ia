"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  // Si el password es correcto y la cuenta tiene 2FA, authorize() en
  // lib/auth.ts tira un Error("OTP_REQUIRED") en vez de devolver null — eso
  // es lo único que distingue "faltó el segundo factor" de "credenciales
  // inválidas", así que acá lo usamos para mostrar el segundo paso.
  const [needsOtp, setNeedsOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, otp, redirect: false });
    setLoading(false);

    if (res?.error) {
      if (res.error === "OTP_REQUIRED") {
        setNeedsOtp(true);
        return;
      }
      setError(res.error === "CredentialsSignin" ? "Credenciales inválidas" : res.error);
      return;
    }
    router.push("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-console">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-sm border border-line bg-panel p-6">
        <h1 className="font-mono text-lg font-semibold text-ink">Acceso al panel de control</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={needsOtp}
          className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal disabled:opacity-50"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={needsOtp}
          className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal disabled:opacity-50"
          required
        />

        {needsOtp && (
          <input
            type="text"
            inputMode="numeric"
            placeholder="Código 2FA (6 dígitos)"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            autoFocus
            className="w-full rounded-sm border border-signal bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            required
          />
        )}

        {error && <p className="font-mono text-xs text-fault">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm border border-signal bg-signal-soft py-2 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-on-accent disabled:opacity-40"
        >
          {loading ? "Ingresando…" : needsOtp ? "Verificar código" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
