import React from "react";
import { ActionIcon, Button, Card, Group, Select, Stack, Switch, TextInput } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { TemplateField } from "@/features/zeaatlas/templates/types/template.types";

interface TemplateFieldEditorProps {
  field: TemplateField;
  onChange: (field: TemplateField) => void;
  onRemove: () => void;
}

const FIELD_TYPE_OPTIONS = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Select", value: "select" },
];

export default function TemplateFieldEditor({
  field,
  onChange,
  onRemove,
}: TemplateFieldEditorProps) {
  const handleOptionsChange = (value: string) => {
    onChange({
      ...field,
      options: value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group grow>
            <TextInput
              label="Label"
              placeholder="Field label"
              value={field.label}
              onChange={(event) =>
                onChange({ ...field, label: event.currentTarget.value })
              }
            />

            <Select
              label="Type"
              data={FIELD_TYPE_OPTIONS}
              value={field.type}
              onChange={(value) =>
                onChange({
                  ...field,
                  type: (value || "text") as TemplateField["type"],
                  options: value === "select" ? field.options || [] : [],
                })
              }
            />
          </Group>

          <ActionIcon variant="subtle" color="red" mt={26} onClick={onRemove}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>

        {field.type !== "checkbox" && (
          <TextInput
            label="Placeholder"
            placeholder="Optional placeholder"
            value={field.placeholder || ""}
            onChange={(event) =>
              onChange({ ...field, placeholder: event.currentTarget.value })
            }
          />
        )}

        {field.type === "select" && (
          <TextInput
            label="Options"
            description="Comma-separated values"
            placeholder="High, Medium, Low"
            value={(field.options || []).join(", ")}
            onChange={(event) => handleOptionsChange(event.currentTarget.value)}
          />
        )}

        <Switch
          label="Required"
          checked={field.required}
          onChange={(event) =>
            onChange({ ...field, required: event.currentTarget.checked })
          }
        />
      </Stack>
    </Card>
  );
}
