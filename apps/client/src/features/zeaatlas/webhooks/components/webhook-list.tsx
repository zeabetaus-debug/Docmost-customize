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
  Tooltip,
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

/* =====================================================
   ✅ USER NAME
===================================================== */
function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.name || localStorage.getItem("user_name") || "User";
  } catch {
    return "User";
  }
}

/* =====================================================
   TYPES
===================================================== */
interface WebhookListProps {
  webhooks?: IWebhook[];
  isLoading?: boolean;
  onAddWebhook: () => void;
  onEditWebhook: (webhook: IWebhook) => void;
}

/* =====================================================
   HELPERS
===================================================== */

// EVENTS
function parseEvents(events: any): string[] {
  try {
    if (Array.isArray(events)) return events;
    return JSON.parse(events || "[]");
  } catch {
    return [];
  }
}

// TOKEN
function maskToken(token?: string) {
  if (!token) return "Not set";
  return `****${token.slice(-4)}`;
}

// DATE
function formatDate(date?: string) {
  if (!date) return "N/A";

  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function WebhookList({
  webhooks = [],
  isLoading = false,
  onAddWebhook,
  onEditWebhook,
}: WebhookListProps) {
  const clipboard = useClipboard();
  const updateMutation = useUpdateWebhookMutation();
  const deleteMutation = useDeleteWebhookMutation();

  const ACCOUNT_NAME = getUserName();

  /* =====================================================
     COPY
  ===================================================== */
  const handleCopy = (value: string, label: string) => {
    clipboard.copy(value);
    notifications.show({
      message: `${label} copied`,
      color: "green",
    });
  };

  /* =====================================================
     DELETE
  ===================================================== */
  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this webhook?")) return;
    deleteMutation.mutate(id);
  };

  /* =====================================================
     🔥 TOGGLE FIX (FINAL)
  ===================================================== */
  const handleToggle = async (webhook: IWebhook) => {
    if (updateMutation.isPending) return; // prevent spam

    try {
      await updateMutation.mutateAsync({
        id: webhook.id,
        active: !webhook.active,
      });
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */
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

  /* =====================================================
     EMPTY
  ===================================================== */
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

  /* =====================================================
     UI
  ===================================================== */
  return (
    <Stack gap="md">
      {webhooks.map((webhook) => (
        <Card key={webhook.id} withBorder radius="md" p="md">
          <Stack gap="md">

            {/* HEADER */}
            <Group justify="space-between">
              <Stack gap={2}>
                <Group gap="xs">
                  <Text fw={600}>{webhook.name}</Text>

                  <Badge color={webhook.active ? "green" : "gray"}>
                    {webhook.active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </Group>

                {/* URL */}
                <Group gap={6}>
                  <Text size="sm" c="dimmed">
                    {webhook.url}
                  </Text>

                  <Tooltip label="Copy URL">
                    <ActionIcon
                      onClick={() => handleCopy(webhook.url, "URL")}
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Stack>

              {/* ACTIONS */}
              <Group>
                <Tooltip label="Enable / Disable webhook">
                  <Switch
                    checked={webhook.active}
                    disabled={updateMutation.isPending}
                    onChange={() => handleToggle(webhook)}
                  />
                </Tooltip>

                <Tooltip label="Edit">
                  <ActionIcon
                    color="blue"
                    onClick={() => onEditWebhook(webhook)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Delete">
                  <ActionIcon
                    color="red"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>

            {/* EVENTS */}
            {webhook.active && (
              <Group>
                {parseEvents(webhook.events).map((event) => (
                  <Badge key={event}>{event}</Badge>
                ))}
              </Group>
            )}

            {/* FOOTER */}
            <Stack gap={2}>
              <Text size="sm">
                Token: {maskToken(webhook.apiToken)}
              </Text>

              <Text size="xs" c="dimmed">
                Created by: {ACCOUNT_NAME} • {formatDate(webhook.createdAt)}
              </Text>
            </Stack>

          </Stack>
        </Card>
      ))}
    </Stack>
  );
}