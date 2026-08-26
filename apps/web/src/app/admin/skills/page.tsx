"use client";

import { AdminCrudPage, type FieldConfig } from "@/components/admin/AdminCrudPage";

const fields: FieldConfig[] = [
  { name: "name", label: "Nombre", type: "text", required: true },
  {
    name: "category",
    label: "Categoría",
    type: "select",
    options: ["language", "framework", "tool", "database", "soft-skill", "other"],
  },
  { name: "proficiency", label: "Nivel (1-100)", type: "number", required: true },
  { name: "yearsOfExperience", label: "Años de experiencia", type: "number" },
  { name: "iconUrl", label: "URL del ícono", type: "text" },
];

export default function AdminSkillsPage() {
  return (
    <AdminCrudPage resource="skills" title="Skills" fields={fields} columns={["name", "category", "proficiency"]} />
  );
}
