"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true },
  { name: "role", label: "Cargo", type: "text", required: true },
  { name: "company", label: "Empresa", type: "text" },
  { name: "relationship", label: "Relación", type: "text", required: true },
  { name: "testimonial", label: "Testimonio", type: "textarea", required: true },
  { name: "linkedinUrl", label: "URL de LinkedIn", type: "text" },
  { name: "isPublished", label: "Publicado", type: "boolean" },
];

export default function AdminReferencesPage() {
  return (
    <AdminCrudPage
      resource="references"
      title="Referencias"
      fields={fields}
      columns={["name", "role", "isPublished"]}
    />
  );
}
