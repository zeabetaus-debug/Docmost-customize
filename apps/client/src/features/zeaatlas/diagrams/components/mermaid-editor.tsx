import { Button, Group, Paper, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { IconCopy, IconDeviceFloppy } from "@tabler/icons-react";

interface MermaidEditorProps {
  title: string;
  code: string;
  onCodeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onSaveVersion: () => void;
  onCopyCode: () => void;
  isSaving?: boolean;
}

export function MermaidEditor({
  title,
  code,
  onCodeChange,
  onTitleChange,
  onSaveVersion,
  onCopyCode,
  isSaving = false,
}: MermaidEditorProps) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <div>
            <Text fw={600}>Mermaid Editor</Text>
            <Text size="sm" c="dimmed">
              Write Mermaid code and preview it live.
            </Text>
          </div>
          <Group gap="sm">
            <Button variant="default" leftSection={<IconCopy size={16} />} onClick={onCopyCode}>
              Copy Code
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={onSaveVersion}
              loading={isSaving}
            >
              Save Version
            </Button>
          </Group>
        </Group>

        <TextInput
          label="Diagram Title"
          placeholder="Untitled Diagram"
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
        />

        <Textarea
          label="Diagram Code"
          minRows={16}
          autosize
          value={code}
          onChange={(event) => onCodeChange(event.currentTarget.value)}
          styles={{ input: { fontFamily: "monospace" } }}
        />
      </Stack>
    </Paper>
  );
}
