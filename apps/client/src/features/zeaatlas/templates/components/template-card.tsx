import React from "react";
import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { Template } from "@/features/zeaatlas/templates/types/template.types";

interface TemplateCardProps {
  template: Template;
  onDelete: (id: string) => void;
}

export default function TemplateCard({ template, onDelete }: TemplateCardProps) {
  const navigate = useNavigate();

  const handleDelete = () => {
    onDelete(template.id);
    notifications.show({ message: "Template deleted", color: "green" });
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Text fw={600}>{template.name}</Text>
        {template.description && (
          <Text size="sm" c="dimmed">
            {template.description}
          </Text>
        )}
        <Text size="sm">Fields: {template.fields.length}</Text>
        <Text size="xs" c="dimmed">
          Created: {new Date(template.createdAt).toLocaleString()}
        </Text>

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => navigate(`/templates/create?templateId=${template.id}`)}
          >
            Open
          </Button>
          <Button color="red" variant="light" onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
