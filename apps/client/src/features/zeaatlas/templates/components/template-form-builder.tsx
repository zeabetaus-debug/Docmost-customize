import React from "react";
import { Button, Stack } from "@mantine/core";
import TemplateFieldEditor from "@/features/zeaatlas/templates/components/template-field-editor";
import { TemplateField } from "@/features/zeaatlas/templates/types/template.types";
import { createEmptyField } from "@/features/zeaatlas/templates/utils/template-utils";

interface TemplateFormBuilderProps {
  fields: TemplateField[];
  onChange: (fields: TemplateField[]) => void;
}

export default function TemplateFormBuilder({
  fields,
  onChange,
}: TemplateFormBuilderProps) {
  const handleFieldChange = (id: string, nextField: TemplateField) => {
    onChange(fields.map((field) => (field.id === id ? nextField : field)));
  };

  const handleFieldRemove = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const handleAddField = () => {
    onChange([...fields, createEmptyField()]);
  };

  return (
    <Stack gap="md">
      {fields.map((field) => (
        <TemplateFieldEditor
          key={field.id}
          field={field}
          onChange={(nextField) => handleFieldChange(field.id, nextField)}
          onRemove={() => handleFieldRemove(field.id)}
        />
      ))}

      <Button variant="default" onClick={handleAddField}>
        Add Field
      </Button>
    </Stack>
  );
}
