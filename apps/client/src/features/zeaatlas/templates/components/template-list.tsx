import React from "react";
import { Button, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import TemplateCard from "@/features/zeaatlas/templates/components/template-card";
import { Template } from "@/features/zeaatlas/templates/types/template.types";

interface TemplateListProps {
  templates: Template[];
  onDelete: (id: string) => void;
}

export default function TemplateList({ templates, onDelete }: TemplateListProps) {
  const navigate = useNavigate();

  if (templates.length === 0) {
    return (
      <Stack align="center" gap="sm">
        <Text c="dimmed">No templates created</Text>
        <Button onClick={() => navigate("/templates/create")}>Create Template</Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} onDelete={onDelete} />
      ))}
    </Stack>
  );
}
