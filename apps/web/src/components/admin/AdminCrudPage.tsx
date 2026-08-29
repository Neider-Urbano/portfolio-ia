"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "date" | "tags" | "select";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

interface AdminCrudPageProps {
  resource: string;
  title: string;
  fields: FieldConfig[];
  columns: string[];
  /** Nombre del campo con una URL — agrega una acción "Abrir ↗" por fila. */
  linkField?: string;
  /** Nombres de campos a mostrar en una fila de detalle expandible (además de las columnas de la tabla). */
  detailFields?: string[];
}

type Item = Record<string, any>;

function toFormValue(item: Item | null, field: FieldConfig): any {
  // Un <select> sin valor "" entre sus <option> igual muestra la primera
  // opción por defecto en el navegador, aunque el estado de React se quede
  // en "" hasta el primer onChange — si el usuario no toca el desplegable,
  // se envía "" en vez del valor visible, que el backend rechaza (no es un
  // valor válido del enum). Por eso el valor inicial debe ser la primera
  // opción real, no "".
  if (!item) {
    if (field.type === "boolean") return false;
    if (field.type === "select") return field.options?.[0] ?? "";
    return "";
  }
  const raw = item[field.name];
  if (field.type === "date") return raw ? String(raw).slice(0, 10) : "";
  if (field.type === "tags") return Array.isArray(raw) ? raw.join(", ") : "";
  if (field.type === "boolean") return !!raw;
  if (field.type === "select") return raw || field.options?.[0] || "";
  return raw ?? "";
}

function buildPayload(fields: FieldConfig[], values: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const field of fields) {
    const v = values[field.name];
    if (field.type === "tags") {
      payload[field.name] = String(v ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (field.type === "number") {
      payload[field.name] = v === "" || v === undefined ? undefined : Number(v);
    } else if (field.type === "boolean") {
      payload[field.name] = !!v;
    } else if (field.type === "date") {
      payload[field.name] = v || null;
    } else {
      payload[field.name] = v;
    }
  }
  return payload;
}

function formatCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

/**
 * Tabla + formulario modal genéricos para cualquier colección del dashboard.
 * Cada página (/admin/proyectos, /admin/experiencia, ...) solo declara sus
 * campos y columnas; este componente maneja listar, crear, editar y borrar
 * contra /api/admin/{resource} (GET/POST) y /api/admin/{resource}/[id]
 * (PUT/DELETE), que todas siguen la misma forma de respuesta { items }/{ item }.
 */
export function AdminCrudPage({ resource, title, fields, columns, linkField, detailFields }: AdminCrudPageProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/${resource}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const openCreate = () => {
    setEditingItem(null);
    const initial: Record<string, any> = {};
    for (const f of fields) initial[f.name] = toFormValue(null, f);
    setFormValues(initial);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    const initial: Record<string, any> = {};
    for (const f of fields) initial[f.name] = toFormValue(item, f);
    setFormValues(initial);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = buildPayload(fields, formValues);
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/admin/${resource}/${editingItem!._id}` : `/api/admin/${resource}`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const message = data?.error ? JSON.stringify(data.error) : "Error al guardar";
      setError(message);
      toast.error(message);
      return;
    }

    toast.success("Guardado");
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este elemento? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminado");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-xl font-semibold text-ink">{title}</h1>
        <button
          onClick={openCreate}
          className="rounded-sm border border-signal bg-signal-soft px-4 py-2 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-console"
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink-faint">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="font-mono text-sm text-ink-faint">Aún no hay elementos.</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2 font-medium">
                    {fields.find((f) => f.name === c)?.label ?? c}
                  </th>
                ))}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <Fragment key={item._id}>
                  <tr className="border-t border-line">
                    {columns.map((c) => (
                      <td key={c} className="px-4 py-2 text-ink">
                        {formatCell(item[c])}
                      </td>
                    ))}
                    <td className="space-x-3 px-4 py-2 text-right font-mono text-xs uppercase tracking-wide">
                      {detailFields && detailFields.length > 0 && (
                        <button
                          onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                          className="text-ink-muted hover:underline"
                        >
                          {expandedId === item._id ? "Ocultar" : "Detalle"}
                        </button>
                      )}
                      {linkField && item[linkField] && (
                        <a
                          href={item[linkField]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-signal hover:underline"
                        >
                          Abrir ↗
                        </a>
                      )}
                      <button onClick={() => openEdit(item)} className="text-signal hover:underline">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="text-ink-faint hover:underline">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  {expandedId === item._id && detailFields && (
                    <tr className="border-t border-line bg-console">
                      <td colSpan={columns.length + 1} className="px-4 py-3">
                        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {detailFields.map((name) => {
                            const field = fields.find((f) => f.name === name);
                            return (
                              <div key={name}>
                                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                                  {field?.label ?? name}
                                </dt>
                                <dd className="text-sm text-ink-muted">{formatCell(item[name])}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-line bg-panel-raised p-6"
          >
            <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-ink-faint">
              {editingItem ? "Editar" : "Nuevo"} · {title}
            </h2>

            <div className="space-y-3">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formValues[field.name]}
                  onChange={(v) => setFormValues((prev) => ({ ...prev, [field.name]: v }))}
                />
              ))}
            </div>

            {error && <p className="mt-3 font-mono text-xs text-fault">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-sm border border-line px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink-muted hover:border-signal hover:text-signal"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-sm border border-signal bg-signal-soft px-4 py-2 font-mono text-xs uppercase tracking-wide text-signal transition-colors hover:bg-signal hover:text-console disabled:opacity-40"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FormField({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (v: any) => void }) {
  const baseInputClass =
    "w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-ink outline-none focus:border-signal";

  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        {field.label}
        {field.required && " *"}
      </span>

      {field.type === "textarea" && (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={3}
          className={baseInputClass}
        />
      )}

      {field.type === "boolean" && (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-signal"
        />
      )}

      {field.type === "select" && (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={baseInputClass}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {(field.type === "text" || field.type === "tags") && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.type === "tags" ? "separadas por coma" : undefined}
          className={baseInputClass}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={baseInputClass}
        />
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={baseInputClass}
        />
      )}
    </label>
  );
}
