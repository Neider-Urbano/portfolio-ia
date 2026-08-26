"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "title", label: "Título", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true },
  { name: "summary", label: "Resumen corto", type: "textarea", required: true },
  { name: "description", label: "Descripción completa", type: "textarea", required: true },
  { name: "technologies", label: "Tecnologías", type: "tags" },
  { name: "images", label: "URLs de imágenes", type: "tags" },
  { name: "liveUrl", label: "URL en vivo", type: "text" },
  { name: "repoUrl", label: "URL del repositorio", type: "text" },
  { name: "featured", label: "Destacado", type: "boolean" },
  {
    name: "status",
    label: "Estado",
    type: "select",
    options: ["completed", "in-progress", "archived"],
  },
];

export default function AdminProjectsPage() {
  return (
    <AdminCrudPage
      resource="projects"
      title="Proyectos"
      fields={fields}
      columns={["title", "status", "featured", "viewCount"]}
    />
  );
}
