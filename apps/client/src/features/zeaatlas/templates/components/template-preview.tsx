import React from "react";
import { Button, Checkbox, Select, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { TemplateField } from "@/features/zeaatlas/templates/types/template.types";
import { buildTemplateInitialValues } from "@/features/zeaatlas/templates/utils/template-utils";

interface TemplatePreviewProps {
  fields: TemplateField[];
}

export default function TemplatePreview({ fields }: TemplatePreviewProps) {
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const initialValues = fields.reduce<Record<string, any>>((acc, field) => {
      acc[field.id] = buildTemplateInitialValues(field);
      return acc;
    }, {});

    setValues(initialValues);
    setErrors({});
  }, [fields]);

  const handleSubmit = () => {
    const nextErrors = fields.reduce<Record<string, string>>((acc, field) => {
      const value = values[field.id];
      const isEmpty =
        field.type === "checkbox" ? false : String(value || "").trim().length === 0;

      if (field.required && isEmpty) {
        acc[field.id] = `${field.label || "Field"} is required`;
      }

      return acc;
    }, {});

    setErrors(nextErrors);
  };

  return (
    <Stack gap="md">
      {fields.map((field) => {
        if (field.type === "textarea") {
          return (
            <Textarea
              key={field.id}
              label={field.label || "Untitled field"}
              placeholder={field.placeholder}
              required={field.required}
              value={values[field.id] || ""}
              error={errors[field.id]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.id]: event.currentTarget.value,
                }))
              }
            />
          );
        }

        if (field.type === "checkbox") {
          return (
            <Checkbox
              key={field.id}
              label={field.label || "Untitled field"}
              checked={Boolean(values[field.id])}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.id]: event.currentTarget.checked,
                }))
              }
            />
          );
        }

        if (field.type === "select") {
          return (
            <Select
              key={field.id}
              label={field.label || "Untitled field"}
              placeholder={field.placeholder}
              required={field.required}
              data={field.options || []}
              value={values[field.id] || null}
              error={errors[field.id]}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  [field.id]: value || "",
                }))
              }
            />
          );
        }

        return (
          <TextInput
            key={field.id}
            label={field.label || "Untitled field"}
            placeholder={field.placeholder}
            required={field.required}
            value={values[field.id] || ""}
            error={errors[field.id]}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.id]: event.currentTarget.value,
              }))
            }
          />
        );
      })}

      {fields.length === 0 && (
        <Text c="dimmed">Add fields to preview your smart template.</Text>
      )}

      {fields.length > 0 && (
        <Button variant="light" onClick={handleSubmit}>
          Validate Preview
        </Button>
      )}
    </Stack>
  );
}
