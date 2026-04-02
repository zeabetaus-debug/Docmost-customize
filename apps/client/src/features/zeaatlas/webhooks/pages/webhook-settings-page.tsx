import React from "react";
import { Button, Group, Stack } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title";
import { getAppName } from "@/lib/config";

import {
  useWebhooksQuery,
} from "@/features/zeaatlas/webhooks/api/webhook-query";

import WebhookFormModal from "@/features/zeaatlas/webhooks/components/webhook-form-modal";
import WebhookList from "@/features/zeaatlas/webhooks/components/webhook-list";
import WebhookTestPanel from "@/features/zeaatlas/webhooks/components/webhook-test-panel";
import { IWebhook } from "@/features/zeaatlas/webhooks/types/webhook.types";

export default function WebhookSettingsPage() {
  const { t } = useTranslation();

  // ✅ FETCH WEBHOOKS (already cleaned in query)
  const { data: webhooks = [], isLoading } = useWebhooksQuery();

  const [opened, setOpened] = React.useState(false);
  const [selectedWebhook, setSelectedWebhook] =
    React.useState<IWebhook | null>(null);

  // OPEN CREATE
  const handleCreate = () => {
    setSelectedWebhook(null);
    setOpened(true);
  };

  // OPEN EDIT
  const handleEdit = (webhook: IWebhook) => {
    setSelectedWebhook(webhook);
    setOpened(true);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Helmet>
        <title>{`Automation Webhooks - ${getAppName()}`}</title>
      </Helmet>

      {/* HEADER */}
      <Group justify="space-between" mb="md">
        <SettingsTitle title={t("Automation Webhooks")} />
        <Button onClick={handleCreate}>Add Webhook</Button>
      </Group>

      {/* CONTENT */}
      <Stack gap="lg">

        {/* ✅ LIST */}
        <WebhookList
          webhooks={webhooks}
          isLoading={isLoading}
          onAddWebhook={handleCreate}
          onEditWebhook={handleEdit}
        />

        {/* TEST PANEL */}
        <WebhookTestPanel />

      </Stack>

      {/* ✅ SINGLE MODAL (FINAL FIX) */}
      <WebhookFormModal
        opened={opened}
        onClose={() => setOpened(false)}
        webhook={selectedWebhook}
      />
    </div>
  );
}