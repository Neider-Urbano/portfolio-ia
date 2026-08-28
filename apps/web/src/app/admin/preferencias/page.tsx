"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

interface PreferenceFormState {
  favoriteFootballTeamsText: string;
  favoriteMusicGenresText: string;
  favoriteFoodsText: string;
  maritalStatus: string;
  socioeconomicStratum: string;
  desiredSalary: string;
  prefersRemoteWork: boolean;
  dailyToolsText: string;
}

const emptyState: PreferenceFormState = {
  favoriteFootballTeamsText: "",
  favoriteMusicGenresText: "",
  favoriteFoodsText: "",
  maritalStatus: "",
  socioeconomicStratum: "",
  desiredSalary: "",
  prefersRemoteWork: false,
  dailyToolsText: "",
};

const inputClass =
  "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

/**
 * A diferencia de /admin/perfil, nada de lo que se carga acá sale nunca al
 * home, a /cv, a /api/resume ni a ninguna tool MCP — Preference vive en su
 * propia colección que solo esta página lee y escribe (ver
 * @portafolio/models/Preference.ts y /api/admin/preferences/route.ts).
 */
export default function AdminPreferenciasPage() {
  const [form, setForm] = useState<PreferenceFormState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/preferences");
      const data = await res.json();
      const p = data.item;
      if (p) {
        setForm({
          favoriteFootballTeamsText: (p.favoriteFootballTeams ?? []).join(", "),
          favoriteMusicGenresText: (p.favoriteMusicGenres ?? []).join(", "),
          favoriteFoodsText: (p.favoriteFoods ?? []).join(", "),
          maritalStatus: p.maritalStatus ?? "",
          socioeconomicStratum: p.socioeconomicStratum != null ? String(p.socioeconomicStratum) : "",
          desiredSalary: p.desiredSalary ?? "",
          prefersRemoteWork: !!p.prefersRemoteWork,
          dailyToolsText: (p.dailyTools ?? []).join(", "),
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = <K extends keyof PreferenceFormState>(field: K, value: PreferenceFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const toList = (text: string) =>
      text
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    const payload = {
      favoriteFootballTeams: toList(form.favoriteFootballTeamsText),
      favoriteMusicGenres: toList(form.favoriteMusicGenresText),
      favoriteFoods: toList(form.favoriteFoodsText),
      maritalStatus: form.maritalStatus,
      socioeconomicStratum: form.socioeconomicStratum ? Number(form.socioeconomicStratum) : undefined,
      desiredSalary: form.desiredSalary,
      prefersRemoteWork: form.prefersRemoteWork,
      dailyTools: toList(form.dailyToolsText),
    };

    const res = await fetch("/api/admin/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("Preferencias actualizadas");
    } else {
      toast.error("Ocurrió un error al guardar");
    }
  };

  if (loading) return <p className="font-mono text-sm text-ink-faint">Cargando…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-mono text-xl font-semibold text-ink">Preferencias</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Privado — solo vos ves esto acá. Nunca se muestra en el home, en /cv, ni el chat de IA puede contarlo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Equipos de fútbol preferidos (separados por coma)">
          <input
            value={form.favoriteFootballTeamsText}
            onChange={(e) => handleChange("favoriteFootballTeamsText", e.target.value)}
            placeholder="Millonarios, Real Madrid"
            className={inputClass}
          />
        </Field>

        <Field label="Géneros musicales preferidos (separados por coma)">
          <input
            value={form.favoriteMusicGenresText}
            onChange={(e) => handleChange("favoriteMusicGenresText", e.target.value)}
            placeholder="Reggaetón, Rock, Vallenato"
            className={inputClass}
          />
        </Field>

        <Field label="Comidas preferidas (separadas por coma)">
          <input
            value={form.favoriteFoodsText}
            onChange={(e) => handleChange("favoriteFoodsText", e.target.value)}
            placeholder="Bandeja paisa, Sushi"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Estado civil">
            <input
              value={form.maritalStatus}
              onChange={(e) => handleChange("maritalStatus", e.target.value)}
              placeholder="Soltero, casado…"
              className={inputClass}
            />
          </Field>
          <Field label="Estrato socioeconómico (1-6)">
            <input
              type="number"
              min={1}
              max={6}
              value={form.socioeconomicStratum}
              onChange={(e) => handleChange("socioeconomicStratum", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Salario esperado">
          <input
            value={form.desiredSalary}
            onChange={(e) => handleChange("desiredSalary", e.target.value)}
            placeholder="$4.000.000 - $6.000.000 COP"
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.prefersRemoteWork}
            onChange={(e) => handleChange("prefersRemoteWork", e.target.checked)}
            className="h-4 w-4 accent-signal"
          />
          Prefiero oportunidades remotas
        </label>

        <Field label="Herramientas que uso a diario en mi trabajo (separadas por coma)">
          <input
            value={form.dailyToolsText}
            onChange={(e) => handleChange("dailyToolsText", e.target.value)}
            placeholder="VS Code, Slack, Jira, Postman, Notion"
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
