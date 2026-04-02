import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Checkbox,
  Group,
  Switch,
} from "@mantine/core";

import {
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
} from "@/features/zeaatlas/webhooks/api/webhook-query";

import {
  IWebhook,
  IWebhookInput,
  WebhookEvent,
} from "@/features/zeaatlas/webhooks/types/webhook.types";

interface Props {
  opened: boolean;
  onClose: () => void;
  webhook?: IWebhook | null;
}

export default function WebhookFormModal({
  opened,
  onClose,
  webhook,
}: Props) {
  const { mutateAsync: createWebhook } = useCreateWebhookMutation();
  const { mutateAsync: updateWebhook } = useUpdateWebhookMutation();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<IWebhookInput>({
    name: "",
    url: "",
    events: [],
    apiToken: "",
    active: true,
  });

  // ✅ EDIT MODE
  useEffect(() => {
    if (webhook) {
      setForm({
        name: webhook.name || "",
        url: webhook.url || "",
        events: webhook.events || [],
        apiToken: webhook.apiToken || "",
        active: webhook.active ?? true,
      });
    } else {
      setForm({
        name: "",
        url: "",
        events: [],
        apiToken: "",
        active: true,
      });
    }
  }, [webhook]);

  // ✅ INPUT CHANGE
  const handleChange = <K extends keyof IWebhookInput>(
    field: K,
    value: IWebhookInput[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ TOGGLE EVENTS (TYPE SAFE)
  const toggleEvent = (event: WebhookEvent) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  // ✅ TOKEN GENERATOR
  const generateToken = () => {
    const token = Math.random().toString(36).substring(2, 18);
    handleChange("apiToken", token);
  };

  // ✅ SUBMIT (FINAL FIX 🔥)
  const handleSubmit = async () => {
    if (!form.url) {
      alert("Webhook URL is required");
      return;
    }

    if (form.events.length === 0) {
      alert("Select at least one event");
      return;
    }

    try {
      setLoading(true);

      console.log("🚀 Submitting:", form);

      if (webhook?.id) {
        await updateWebhook({
          id: webhook.id,
          ...form,
        });
      } else {
        await createWebhook(form);
      }

      console.log("✅ Success");

      onClose();
    } catch (err) {
      console.error("❌ Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Webhook" centered>
      <Stack>

        {/* NAME */}
        <TextInput
          label="Name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        {/* URL */}
        <TextInput
          label="Webhook URL"
          placeholder="https://webhook.site/xxxx"
          value={form.url}
          onChange={(e) => handleChange("url", e.target.value)}
        />

        {/* EVENTS */}
        <Stack gap={4}>
          <Checkbox
            label="page.created"
            checked={form.events.includes("page.created")}
            onChange={() => toggleEvent("page.created")}
          />
          <Checkbox
            label="page.updated"
            checked={form.events.includes("page.updated")}
            onChange={() => toggleEvent("page.updated")}
          />
          <Checkbox
            label="page.approved"
            checked={form.events.includes("page.approved")}
            onChange={() => toggleEvent("page.approved")}
          />
        </Stack>

        {/* TOKEN */}
        <Group grow>
          <TextInput
            label="Secret Token"
            value={form.apiToken}
            onChange={(e) => handleChange("apiToken", e.target.value)}
          />

          <Button mt={25} onClick={generateToken}>
            Auto-generate
          </Button>
        </Group>

        {/* ACTIVE */}
        <Switch
          label="Active"
          checked={form.active}
          onChange={(e) =>
            handleChange("active", e.currentTarget.checked)
          }
        />

        {/* ACTIONS */}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} loading={loading}>
            {webhook ? "Update Webhook" : "Create Webhook"}
          </Button>
        </Group>

      </Stack>
    </Modal>
  );
}