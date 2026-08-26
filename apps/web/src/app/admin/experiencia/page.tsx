"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "company", label: "Empresa", type: "text", required: true },
  { name: "role", label: "Cargo", type: "text", required: true },
  { name: "startDate", label: "Fecha de inicio", type: "date", required: true },
  { name: "endDate", label: "Fecha de fin", type: "date" },
  { name: "isCurrent", label: "Trabajo actual", type: "boolean" },
  { name: "description", label: "Descripción", type: "textarea", required: true },
  { name: "technologies", label: "Tecnologías", type: "tags" },
  { name: "location", label: "Ubicación", type: "text" },
];

export default function AdminExperiencePage() {
  return (
    <AdminCrudPage
      resource="experience"
      title="Experiencia laboral"
      fields={fields}
      columns={["company", "role", "startDate", "isCurrent"]}
    />
  );
}
