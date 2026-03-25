import React from "react";
import { Button, Container, Group, Stack, Title } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { getAppName } from "@/lib/config";
import TemplateList from "@/features/zeaatlas/templates/components/template-list";
import { useMockTemplates } from "@/features/zeaatlas/templates/hooks/use-mock-templates";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, deleteTemplate } = useMockTemplates();

  return (
    <Container size="lg" py="xl">
      <Helmet>
        <title>{`Smart Templates - ${getAppName()}`}</title>
      </Helmet>

      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Smart Templates</Title>
          <Button onClick={() => navigate("/templates/create")}>Create Template</Button>
        </Group>

        <TemplateList templates={templates} onDelete={deleteTemplate} />
      </Stack>
    </Container>
  );
}
