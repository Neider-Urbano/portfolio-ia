"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "institution", label: "Institución", type: "text", required: true },
  { name: "degree", label: "Título/Nombre", type: "text", required: true },
  { name: "fieldOfStudy", label: "Área de estudio", type: "text" },
  { name: "type", label: "Tipo", type: "select", options: ["degree", "certification", "course"], required: true },
  { name: "startDate", label: "Fecha de inicio", type: "date", required: true },
  { name: "endDate", label: "Fecha de fin", type: "date" },
  { name: "isCurrent", label: "En curso", type: "boolean" },
  { name: "credentialUrl", label: "URL de la credencial", type: "text" },
];

export default function AdminEducationPage() {
  return (
    <AdminCrudPage
      resource="education"
      title="Estudios y certificaciones"
      fields={fields}
      columns={["institution", "degree", "type", "startDate"]}
    />
  );
}
