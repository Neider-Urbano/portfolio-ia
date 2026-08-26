"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true },
  { name: "message", label: "Comentario", type: "textarea", required: true },
  { name: "isApproved", label: "Publicado", type: "boolean" },
];

export default function AdminCommentsPage() {
  return (
    <AdminCrudPage
      resource="comments"
      title="Comentarios"
      fields={fields}
      columns={["name", "message", "isApproved"]}
    />
  );
}
