import React from "react";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Switch,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IWebhook,
  IWebhookInput,
  WEBHOOK_EVENTS,
  WebhookEvent,
} from "@/features/zeaatlas/webhooks/types/webhook.types";
import {
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
} from "@/features/zeaatlas/webhooks/api/webhook-query";

interface WebhookFormModalProps {
  opened: boolean;
  onClose: () => void;
  webhook?: IWebhook | null;
}

function generateSecret() {
  return crypto.randomUUID().replace(/-/g, "");
}

function getInitialState(webhook?: IWebhook | null): IWebhookInput {
  return {
    name: webhook?.name || "",
    url: webhook?.url || "",
    events: webhook?.events || [],
    active: webhook?.active ?? true,
    secret: webhook?.secret || generateSecret(),
  };
}

export default function WebhookFormModal({
  opened,
  onClose,
  webhook,
}: WebhookFormModalProps) {
  const createMutation = useCreateWebhookMutation();
  const updateMutation = useUpdateWebhookMutation();
  const [form, setForm] = React.useState<IWebhookInput>(getInitialState(webhook));

  React.useEffect(() => {
    if (opened) {
      setForm(getInitialState(webhook));
    }
  }, [opened, webhook]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleEventsChange = (eventName: WebhookEvent, checked: boolean) => {
    setForm((current) => ({
      ...current,
      events: checked
        ? [...current.events, eventName]
        : current.events.filter((item) => item !== eventName),
    }));
  };

  const handleSubmit = async () => {
    try {
      const url = new URL(form.url);
      if (!url.protocol.startsWith("http")) {
        throw new Error("Invalid URL");
      }
    } catch {
      notifications.show({ message: "Please enter a valid URL", color: "red" });
      return;
    }

    if (form.events.length === 0) {
      notifications.show({ message: "Select at least one event", color: "red" });
      return;
    }

    if (webhook?.id) {
      await updateMutation.mutateAsync({ id: webhook.id, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }

    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={webhook ? "Edit Webhook" : "Add Webhook"}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="n8n outbound hook"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.currentTarget.value }))
          }
        />

        <TextInput
          label="Webhook URL"
          placeholder="https://n8n.example.com/webhook/docmost"
          value={form.url}
          onChange={(event) =>
            setForm((current) => ({ ...current, url: event.currentTarget.value }))
          }
        />

        <Checkbox.Group label="Events" value={form.events}>
          <Stack gap="xs" mt="xs">
            {WEBHOOK_EVENTS.map((eventName) => (
              <Checkbox
                key={eventName}
                label={eventName}
                checked={form.events.includes(eventName)}
                onChange={(event) =>
                  handleEventsChange(eventName, event.currentTarget.checked)
                }
              />
            ))}
          </Stack>
        </Checkbox.Group>

        <Group align="flex-end" grow>
          <TextInput
            label="Secret Token"
            value={form.secret || ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, secret: event.currentTarget.value }))
            }
          />
          <Button
            variant="default"
            onClick={() =>
              setForm((current) => ({ ...current, secret: generateSecret() }))
            }
          >
            Auto-generate
          </Button>
        </Group>

        <Switch
          label="Active"
          checked={form.active}
          onChange={(event) =>
            setForm((current) => ({ ...current, active: event.currentTarget.checked }))
          }
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            {webhook ? "Save Changes" : "Create Webhook"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
