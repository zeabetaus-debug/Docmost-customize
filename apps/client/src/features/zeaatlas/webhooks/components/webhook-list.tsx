import React from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Skeleton,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import {
  IconCopy,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useClipboard } from "@/hooks/use-clipboard";
import {
  useDeleteWebhookMutation,
  useUpdateWebhookMutation,
} from "@/features/zeaatlas/webhooks/api/webhook-query";
import { IWebhook } from "@/features/zeaatlas/webhooks/types/webhook.types";

interface WebhookListProps {
  webhooks?: IWebhook[];
  isLoading?: boolean;
  onAddWebhook: () => void;
  onEditWebhook: (webhook: IWebhook) => void;
}

function maskSecret(secret?: string) {
  if (!secret) return "Not set";
  const suffix = secret.slice(-4);
  return `****${suffix}`;
}

export default function WebhookList({
  webhooks = [],
  isLoading = false,
  onAddWebhook,
  onEditWebhook,
}: WebhookListProps) {
  const clipboard = useClipboard();
  const updateMutation = useUpdateWebhookMutation();
  const deleteMutation = useDeleteWebhookMutation();

  const handleCopy = (value: string, label: string) => {
    clipboard.copy(value);
    notifications.show({ message: `${label} copied`, color: "green" });
  };

  const handleToggle = async (webhook: IWebhook, active: boolean) => {
    await updateMutation.mutateAsync({
      id: webhook.id,
      active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this webhook?")) return;
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <Stack gap="md">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} withBorder radius="md" p="md">
            <Stack gap="sm">
              <Skeleton height={18} width="35%" />
              <Skeleton height={14} width="65%" />
              <Skeleton height={14} width="45%" />
              <Skeleton height={36} />
            </Stack>
          </Card>
        ))}
      </Stack>
    );
  }

  if (webhooks.length === 0) {
    return (
      <Card withBorder radius="md" p="xl">
        <Stack align="center" gap="sm">
          <Text c="dimmed">No webhooks configured</Text>
          <Button onClick={onAddWebhook}>Add Webhook</Button>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {webhooks.map((webhook) => (
        <Card key={webhook.id} withBorder radius="md" p="md">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Group gap="xs">
                  <Text fw={600}>{webhook.name}</Text>
                  <Badge color={webhook.active ? "green" : "gray"} variant="light">
                    {webhook.active ? "Active" : "Inactive"}
                  </Badge>
                  {webhook.status && (
                    <Badge
                      color={webhook.status === "success" ? "green" : "red"}
                      variant="dot"
                    >
                      {webhook.status}
                    </Badge>
                  )}
                </Group>
                <Group gap={6}>
                  <Text size="sm" c="dimmed">
                    {webhook.url}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => handleCopy(webhook.url, "Webhook URL")}
                  >
                    <IconCopy size={16} />
                  </ActionIcon>
                </Group>
              </Stack>

              <Group gap="xs">
                <Switch
                  checked={webhook.active}
                  onChange={(event) =>
                    handleToggle(webhook, event.currentTarget.checked)
                  }
                  disabled={updateMutation.isPending}
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => onEditWebhook(webhook)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => handleDelete(webhook.id)}
                  loading={deleteMutation.isPending}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>

            <Group gap="xs">
              {webhook.events.map((eventName) => (
                <Badge key={eventName} variant="light" color="blue">
                  {eventName}
                </Badge>
              ))}
            </Group>

            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Group gap={6}>
                  <Text size="sm" c="dimmed">
                    Secret: {maskSecret(webhook.secret)}
                  </Text>
                  {webhook.secret && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => handleCopy(webhook.secret!, "Secret token")}
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                  )}
                </Group>
                <Text size="xs" c="dimmed">
                  Created: {new Date(webhook.createdAt).toLocaleString()}
                </Text>
                {webhook.lastTriggeredAt && (
                  <Text size="xs" c="dimmed">
                    Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                  </Text>
                )}
              </Stack>
            </Group>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
