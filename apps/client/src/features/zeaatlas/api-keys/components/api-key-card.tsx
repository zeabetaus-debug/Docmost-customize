import React from "react";
import { ActionIcon, Badge, Card, Group, Stack, Text } from "@mantine/core";
import { IconCopy, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { ApiKey } from "@/features/zeaatlas/api-keys/types/api-key.types";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
}

function maskKey(key: string) {
  return `****${key.slice(-4)}`;
}

export default function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey.key);
    notifications.show({ message: "API Key copied", color: "green" });
  };

  const handleDelete = () => {
    onDelete(apiKey.id);
    notifications.show({ message: "API Key deleted", color: "green" });
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text fw={600}>{apiKey.name}</Text>
            <Text size="sm" c="dimmed">
              {maskKey(apiKey.key)}
            </Text>
          </Stack>

          <Group gap="xs">
            <ActionIcon variant="subtle" color="gray" onClick={handleCopy}>
              <IconCopy size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="red" onClick={handleDelete}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Group gap="xs">
          {apiKey.scopes.map((scope) => (
            <Badge key={scope} variant="light" color="blue">
              {scope}
            </Badge>
          ))}
        </Group>

        <Text size="xs" c="dimmed">
          Created: {new Date(apiKey.createdAt).toLocaleString()}
        </Text>
      </Stack>
    </Card>
  );
}
