"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "title", label: "Título", type: "text", required: true },
  { name: "description", label: "Descripción", type: "textarea", required: true },
  { name: "order", label: "Orden", type: "number" },
];

export default function AdminServicesPage() {
  return (
    <AdminCrudPage resource="services" title="Servicios" fields={fields} columns={["title", "order"]} />
  );
}
