"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "title", label: "Título", type: "text", required: true },
  { name: "description", label: "Descripción", type: "textarea", required: true },
  { name: "url", label: "URL", type: "text", required: true },
  { name: "source", label: "Fuente (ej. Dev.to)", type: "text" },
  { name: "relevance", label: "Relevancia (1-10)", type: "number" },
  { name: "tags", label: "Tags", type: "tags" },
  { name: "publishedDate", label: "Fecha de publicación", type: "date" },
  { name: "reviewed", label: "Revisado", type: "boolean" },
];

export default function AdminBlogsPage() {
  return (
    <AdminCrudPage
      resource="blogs"
      title="Blogs"
      fields={fields}
      columns={["title", "relevance", "reviewed"]}
    />
  );
}
