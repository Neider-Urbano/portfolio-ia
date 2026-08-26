"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

interface ProfileFormState {
  fullName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  email: string;
  phone: string;
  yearsOfExperience: string;
  resumeUrl: string;
  aiPersona: string;
  socialLinksText: string; // "github:https://... , linkedin:https://..."
  birthDate: string;
  hobbiesText: string; // "fotografía, ajedrez, senderismo"
}

const emptyState: ProfileFormState = {
  fullName: "",
  headline: "",
  bio: "",
  avatarUrl: "",
  location: "",
  email: "",
  phone: "",
  yearsOfExperience: "0",
  resumeUrl: "",
  aiPersona: "",
  socialLinksText: "",
  birthDate: "",
  hobbiesText: "",
};

const inputClass =
  "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

export default function AdminProfilePage() {
  const [form, setForm] = useState<ProfileFormState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      const p = data.item;
      if (p) {
        setForm({
          fullName: p.fullName ?? "",
          headline: p.headline ?? "",
          bio: p.bio ?? "",
          avatarUrl: p.avatarUrl ?? "",
          location: p.location ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          yearsOfExperience: String(p.yearsOfExperience ?? 0),
          resumeUrl: p.resumeUrl ?? "",
          aiPersona: p.aiPersona ?? "",
          socialLinksText: (p.socialLinks ?? [])
            .map((s: { platform: string; url: string }) => `${s.platform}:${s.url}`)
            .join(", "),
          birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : "",
          hobbiesText: (p.hobbies ?? []).join(", "),
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const socialLinks = form.socialLinksText
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [platform, ...rest] = pair.split(":");
        return { platform: platform.trim(), url: rest.join(":").trim() };
      });

    const hobbies = form.hobbiesText
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    const payload = {
      fullName: form.fullName,
      headline: form.headline,
      bio: form.bio,
      avatarUrl: form.avatarUrl,
      location: form.location,
      email: form.email,
      phone: form.phone,
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      resumeUrl: form.resumeUrl,
      aiPersona: form.aiPersona,
      socialLinks,
      birthDate: form.birthDate || "",
      hobbies,
    };

    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("Perfil actualizado");
    } else {
      toast.error("Ocurrió un error al guardar");
    }
  };

  if (loading) return <p className="font-mono text-sm text-ink-faint">Cargando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-mono text-xl font-semibold text-ink">Perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre completo *">
          <input
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Titular / Headline *">
          <input
            value={form.headline}
            onChange={(e) => handleChange("headline", e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Biografía *">
          <textarea
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            required
            rows={4}
            className={inputClass}
          />
        </Field>

        <Field label="Instrucciones de tono para el asistente de IA (aiPersona)">
          <textarea
            value={form.aiPersona}
            onChange={(e) => handleChange("aiPersona", e.target.value)}
            rows={2}
            placeholder="Ej: Responde en primera persona, tono cercano y profesional, en español."
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email *">
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Teléfono">
            <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ubicación">
            <input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Años de experiencia">
            <input
              type="number"
              value={form.yearsOfExperience}
              onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Fecha de nacimiento (solo se muestra la edad calculada, nunca la fecha)">
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => handleChange("birthDate", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Hobbies (separados por coma)">
          <input
            value={form.hobbiesText}
            onChange={(e) => handleChange("hobbiesText", e.target.value)}
            placeholder="fotografía, ajedrez, senderismo"
            className={inputClass}
          />
        </Field>

        <Field label="URL de avatar">
          <input
            value={form.avatarUrl}
            onChange={(e) => handleChange("avatarUrl", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="URL del CV/resume">
          <input
            value={form.resumeUrl}
            onChange={(e) => handleChange("resumeUrl", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Enlaces sociales (formato: plataforma:url, separados por coma)">
          <input
            value={form.socialLinksText}
            onChange={(e) => handleChange("socialLinksText", e.target.value)}
            placeholder="github:https://github.com/tu-usuario, linkedin:https://linkedin.com/in/tu-usuario"
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="rounded-sm border border-signal bg-signal-soft px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-console disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
