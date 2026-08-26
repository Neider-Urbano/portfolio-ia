"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "title", label: "Título", type: "text" },
  { name: "imageUrl", label: "URL de la imagen", type: "text", required: true },
  { name: "caption", label: "Descripción", type: "textarea" },
  { name: "tags", label: "Etiquetas", type: "tags" },
  { name: "order", label: "Orden", type: "number" },
];

export default function AdminGalleryPage() {
  return (
    <AdminCrudPage
      resource="gallery"
      title="Galería de fotos"
      fields={fields}
      columns={["title", "imageUrl", "tags"]}
    />
  );
}
