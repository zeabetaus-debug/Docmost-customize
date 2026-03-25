import React from "react";
import { Button, Container, Group, Paper, Stack, TextInput, Textarea, Title } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { notifications } from "@mantine/notifications";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAppName } from "@/lib/config";
import TemplateFormBuilder from "@/features/zeaatlas/templates/components/template-form-builder";
import TemplatePreview from "@/features/zeaatlas/templates/components/template-preview";
import { useMockTemplates } from "@/features/zeaatlas/templates/hooks/use-mock-templates";
import { TemplateField } from "@/features/zeaatlas/templates/types/template.types";
import { createEmptyField, validateTemplate } from "@/features/zeaatlas/templates/utils/template-utils";

export default function TemplateBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const { createTemplate, getTemplateById, updateTemplate } = useMockTemplates();
  const existingTemplate = React.useMemo(
    () => getTemplateById(templateId),
    [getTemplateById, templateId],
  );

  const [name, setName] = React.useState(existingTemplate?.name || "");
  const [description, setDescription] = React.useState(existingTemplate?.description || "");
  const [fields, setFields] = React.useState<TemplateField[]>(
    existingTemplate?.fields?.length ? existingTemplate.fields : [createEmptyField()],
  );

  React.useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDescription(existingTemplate.description || "");
      setFields(existingTemplate.fields);
    }
  }, [existingTemplate]);

  const handleSave = () => {
    const payload = {
      name,
      description,
      fields,
    };

    const validationError = validateTemplate(payload);
    if (validationError) {
      notifications.show({ message: validationError, color: "red" });
      return;
    }

    if (existingTemplate?.id) {
      updateTemplate(existingTemplate.id, payload);
    } else {
      createTemplate(payload);
    }

    notifications.show({ message: "Template created", color: "green" });
    navigate("/settings/templates");
  };

  return (
    <Container size="xl" py="xl">
      <Helmet>
        <title>{`Template Builder - ${getAppName()}`}</title>
      </Helmet>

      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Template Builder</Title>
          <Group>
            <Button variant="default" onClick={() => navigate("/settings/templates")}>
              Back
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </Group>
        </Group>

        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <TextInput
              label="Template Name"
              placeholder="Client onboarding checklist"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />

            <Textarea
              label="Description"
              placeholder="Short summary of this template"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <TemplateFormBuilder fields={fields} onChange={setFields} />
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4} mb="md">
            Preview
          </Title>
          <TemplatePreview fields={fields} />
        </Paper>
      </Stack>
    </Container>
  );
}
