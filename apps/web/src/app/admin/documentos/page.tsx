"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const resumeFields: FieldConfig[] = [
  { name: "label", label: "Nombre", type: "text", required: true },
  { name: "language", label: "Idioma", type: "select", options: ["es", "en"] },
  { name: "url", label: "URL (Drive u otro)", type: "text", required: true },
  { name: "isPrimary", label: "Primaria (botón principal \"Ver CV\" de la home)", type: "boolean" },
  { name: "isPublic", label: "Pública (visible en la home)", type: "boolean" },
];

const otherFields: FieldConfig[] = [
  { name: "label", label: "Nombre", type: "text", required: true },
  { name: "kind", label: "Tipo", type: "select", options: ["identidad", "otro"] },
  { name: "url", label: "URL (Drive u otro)", type: "text", required: true },
  { name: "isPublic", label: "Pública (visible en la home)", type: "boolean" },
];

export default function AdminDocumentsPage() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            La hoja de vida marcada como primaria es la que descargan los visitantes desde la home.
          </p>
          <a
            href="/cv"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-signal hover:underline"
          >
            Ver mi CV generado en HTML ↗
          </a>
        </div>
        <AdminCrudPage
          resource="documents"
          title="Hojas de vida"
          fields={resumeFields}
          columns={["label", "language", "isPrimary", "isPublic"]}
          linkField="url"
          fixedValues={{ kind: "hoja_vida" }}
          filter={(item) => item.kind === "hoja_vida"}
        />
      </section>

      <section>
        <AdminCrudPage
          resource="documents"
          title="Documentos"
          fields={otherFields}
          columns={["label", "kind", "isPublic"]}
          linkField="url"
          filter={(item) => item.kind !== "hoja_vida"}
        />
      </section>
    </div>
  );
}
