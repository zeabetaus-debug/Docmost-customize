import SettingsTitle from "@/components/settings/settings-title.tsx";
import WorkspaceNameForm from "@/features/workspace/components/settings/components/workspace-name-form";
import WorkspaceIcon from "@/features/workspace/components/settings/components/workspace-icon.tsx";
import ManageHostname from "@/features/workspace/components/settings/components/manage-hostname";
import { useTranslation } from "react-i18next";
import { getAppName, isCloud } from "@/lib/config.ts";
import { Helmet } from "react-helmet-async";
import { Divider } from "@mantine/core";
import React from "react";

export default function WorkspaceSettings() {
  const { t } = useTranslation();

  // 🔥 DEBUG (IMPORTANT)
  console.log("✅ WorkspaceSettings component loaded");

  return (
    <div style={{ padding: "20px" }}>
      {/* 🔥 DEBUG UI */}
      <h1 style={{ color: "" }}>WORKSPACE SETTINGS PAGE</h1>

      <Helmet>
        <title>Workspace Settings - {getAppName()}</title>
      </Helmet>

      <SettingsTitle title={t("General")} />

      <WorkspaceIcon />
      <WorkspaceNameForm />

      {isCloud() && (
        <>
          <Divider my="md" />
          <ManageHostname />
        </>
      )}
    </div>
  );
}