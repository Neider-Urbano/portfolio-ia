"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const inputClass =
  "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

const buttonClass =
  "rounded-sm border border-signal bg-signal-soft px-4 py-2 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-on-accent disabled:opacity-40";

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);

  // Setup en curso (paso "escaneá el QR y confirmá el código")
  const [setup, setSetup] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/security");
    const data = await res.json();
    setTotpEnabled(Boolean(data.totpEnabled));
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startSetup = async () => {
    setBusy(true);
    const res = await fetch("/api/admin/security/2fa/init", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "No se pudo iniciar el setup");
    setSetup({ qrDataUrl: data.qrDataUrl, secret: data.secret });
  };

  const confirmSetup = async () => {
    setBusy(true);
    const res = await fetch("/api/admin/security/2fa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: confirmCode }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Código incorrecto");
    toast.success("2FA activado");
    setSetup(null);
    setConfirmCode("");
    loadStatus();
  };

  const disable = async () => {
    setBusy(true);
    const res = await fetch("/api/admin/security/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: disableCode }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Código incorrecto");
    toast.success("2FA desactivado");
    setDisableCode("");
    loadStatus();
  };

  if (loading) return <p className="font-mono text-sm text-ink-muted">Cargando…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-mono text-lg font-semibold text-ink">Seguridad</h1>
        <p className="mt-1 font-mono text-xs text-ink-muted">
          Verificación en dos pasos (2FA) para el login del panel. Usá una app tipo Google Authenticator, Authy o
          1Password.
        </p>
      </div>

      {totpEnabled && !setup && (
        <div className="space-y-3 rounded-sm border border-line bg-panel p-4">
          <p className="font-mono text-sm text-signal">✓ 2FA activado</p>
          <p className="font-mono text-xs text-ink-muted">
            Para desactivarlo, ingresá el código actual de tu app de autenticación.
          </p>
          <input
            className={inputClass}
            placeholder="123456"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            maxLength={6}
          />
          <button onClick={disable} disabled={busy || disableCode.length !== 6} className={buttonClass}>
            Desactivar 2FA
          </button>
        </div>
      )}

      {!totpEnabled && !setup && (
        <div className="space-y-3 rounded-sm border border-line bg-panel p-4">
          <p className="font-mono text-sm text-ink-muted">2FA no está activado.</p>
          <button onClick={startSetup} disabled={busy} className={buttonClass}>
            Activar 2FA
          </button>
        </div>
      )}

      {setup && (
        <div className="space-y-4 rounded-sm border border-line bg-panel p-4">
          <p className="font-mono text-xs text-ink-muted">
            1. Escaneá este QR con tu app de autenticación (o cargá la clave manualmente).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qrDataUrl} alt="Código QR para 2FA" className="mx-auto h-48 w-48 bg-white p-2" />
          <p className="break-all rounded-sm border border-line bg-console px-3 py-2 text-center font-mono text-xs text-ink-muted">
            {setup.secret}
          </p>
          <p className="font-mono text-xs text-ink-muted">2. Ingresá el código de 6 dígitos que te muestra la app.</p>
          <input
            className={inputClass}
            placeholder="123456"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            maxLength={6}
          />
          <div className="flex gap-2">
            <button onClick={confirmSetup} disabled={busy || confirmCode.length !== 6} className={buttonClass}>
              Confirmar y activar
            </button>
            <button
              onClick={() => {
                setSetup(null);
                setConfirmCode("");
              }}
              className="rounded-sm border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink-muted hover:border-signal hover:text-signal"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
