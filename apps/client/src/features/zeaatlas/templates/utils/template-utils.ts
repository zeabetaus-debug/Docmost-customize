import { Template, TemplateField } from "@/features/zeaatlas/templates/types/template.types";

export function createEmptyField(): TemplateField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  };
}

export function validateTemplate(template: Omit<Template, "id" | "createdAt">) {
  if (!template.name.trim()) {
    return "Template name is required";
  }

  if (template.fields.length === 0) {
    return "Add at least one field";
  }

  const invalidField = template.fields.find(
    (field) => field.required && !field.label.trim(),
  );

  if (invalidField) {
    return "Required fields must have a label";
  }

  return null;
}

export function buildTemplateInitialValues(field: TemplateField) {
  if (field.type === "checkbox") return false;
  if (field.type === "select") return field.options?.[0] || "";
  return field.placeholder || "";
}
