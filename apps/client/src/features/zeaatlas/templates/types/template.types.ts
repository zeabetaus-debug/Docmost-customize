export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  createdAt: string;
}
