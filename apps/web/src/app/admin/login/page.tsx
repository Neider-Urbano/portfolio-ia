"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Credenciales inválidas");
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
          className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          required
        />

        {error && <p className="font-mono text-xs text-fault">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm border border-signal bg-signal-soft py-2 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-console disabled:opacity-40"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
