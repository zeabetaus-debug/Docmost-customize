import React from "react";
import { Button, Card, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTestIncomingWebhookMutation } from "@/features/zeaatlas/webhooks/api/webhook-query";

export default function WebhookTestPanel() {
  const testMutation = useTestIncomingWebhookMutation();
  const [token, setToken] = React.useState("");
  const [payload, setPayload] = React.useState('{\n  "event": "page.updated",\n  "pageId": "demo-page"\n}');

  const handleSubmit = async () => {
    let parsedPayload: unknown;

    try {
      parsedPayload = payload.trim() ? JSON.parse(payload) : {};
    } catch {
      notifications.show({ message: "Payload must be valid JSON", color: "red" });
      return;
    }

    await testMutation.mutateAsync({
      token,
      payload: parsedPayload,
    });
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="md">
        <Text fw={600}>Test Incoming Webhook</Text>

        <TextInput
          label="API Token"
          placeholder="Paste API token"
          value={token}
          onChange={(event) => setToken(event.currentTarget.value)}
        />

        <Textarea
          label="JSON Payload"
          minRows={8}
          autosize
          value={payload}
          onChange={(event) => setPayload(event.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button onClick={handleSubmit} loading={testMutation.isPending}>
            Send Test Request
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
