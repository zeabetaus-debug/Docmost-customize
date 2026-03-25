import { Navigate, Route, Routes } from "react-router-dom";
import SetupWorkspace from "@/pages/auth/setup-workspace.tsx";
import LoginPage from "@/pages/auth/login";
import Home from "@/pages/dashboard/home";
import Page from "@/pages/page/page";
import AccountSettings from "@/pages/settings/account/account-settings";
import WorkspaceMembers from "@/pages/settings/workspace/workspace-members";
import WorkspaceSettings from "@/pages/settings/workspace/workspace-settings";
import Groups from "@/pages/settings/group/groups";
import GroupInfo from "./pages/settings/group/group-info";
import Spaces from "@/pages/settings/space/spaces.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import AccountPreferences from "@/pages/settings/account/account-preferences.tsx";
import SpaceHome from "@/pages/space/space-home.tsx";
import PageRedirect from "@/pages/page/page-redirect.tsx";
import Layout from "@/components/layouts/global/layout.tsx";
import InviteSignup from "@/pages/auth/invite-signup.tsx";
import ForgotPassword from "@/pages/auth/forgot-password.tsx";
import PasswordReset from "./pages/auth/password-reset";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import "@/styles/client-mode.css";
import SharedPage from "@/pages/share/shared-page.tsx";
import Shares from "@/pages/settings/shares/shares.tsx";
import ShareLayout from "@/features/share/components/share-layout.tsx";
import ShareRedirect from "@/pages/share/share-redirect.tsx";
import { useTrackOrigin } from "@/hooks/use-track-origin";
import SpacesPage from "@/pages/spaces/spaces.tsx";
import SpaceTrash from "@/pages/space/space-trash.tsx";
import React, { Suspense } from "react";

const WebhookSettingsPage = React.lazy(
  () => import("@/features/zeaatlas/webhooks/pages/webhook-settings-page"),
);
const ApiKeysPage = React.lazy(
  () => import("@/features/zeaatlas/api-keys/pages/api-keys-page"),
);
const AuditLogPage = React.lazy(
  () => import("@/features/zeaatlas/audit-log/pages/audit-log-page"),
);
const TemplatesPage = React.lazy(
  () => import("@/features/zeaatlas/templates/pages/templates-page"),
);
const TemplateBuilderPage = React.lazy(
  () => import("@/features/zeaatlas/templates/pages/template-builder-page"),
);
const TaxonomyPage = React.lazy(
  () => import("@/features/zeaatlas/taxonomy/pages/taxonomy-page"),
);
const DiagramsPage = React.lazy(
  () => import("@/features/zeaatlas/diagrams/pages/diagrams-page"),
);

export default function App() {
  const { t } = useTranslation();
  useTrackOrigin();
  const [currentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    const isClient = currentUser?.user?.role === "client";
    if (isClient) {
      document.body.classList.add("client-readonly");
    } else {
      document.body.classList.remove("client-readonly");
    }
    return () => {
      document.body.classList.remove("client-readonly");
    };
  }, [currentUser]);

  return (
    <Routes>
      {/* ✅ DEFAULT REDIRECT */}
      <Route index element={<Navigate to="/home" />} />

      {/* ✅ AUTH ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invites/:invitationId" element={<InviteSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/setup/register" element={<SetupWorkspace />} />

      {/* ✅ SHARE ROUTES */}
      <Route element={<ShareLayout />}>
        <Route path="/share/:shareId/p/:pageSlug" element={<SharedPage />} />
        <Route path="/share/p/:pageSlug" element={<SharedPage />} />
      </Route>

      <Route path="/share/:shareId" element={<ShareRedirect />} />
      <Route path="/p/:pageSlug" element={<PageRedirect />} />

      {/* ✅ MAIN APP (WITH LAYOUT) */}
      <Route element={<Layout />}>
        {/* HOME */}
        <Route path="/home" element={<Home />} />
        <Route path="/spaces" element={<SpacesPage />} />
        <Route
          path="/templates/create"
          element={
            <Suspense fallback={null}>
              <TemplateBuilderPage />
            </Suspense>
          }
        />
        <Route
          path="/tools/diagrams"
          element={
            <Suspense fallback={null}>
              <DiagramsPage />
            </Suspense>
          }
        />

        {/* SPACES */}
        <Route path="/s/:spaceSlug" element={<SpaceHome />} />
        <Route path="/s/:spaceSlug/trash" element={<SpaceTrash />} />
        <Route path="/s/:spaceSlug/p/:pageSlug" element={<Page />} />

        {/* ✅ SETTINGS (FIXED FLAT ROUTES) */}
        <Route path="/settings/account/profile" element={<AccountSettings />} />
        <Route path="/settings/account/preferences" element={<AccountPreferences />} />
        <Route path="/settings/workspace" element={<WorkspaceSettings />} />
        <Route path="/settings/members" element={<WorkspaceMembers />} />
        <Route path="/settings/groups" element={<Groups />} />
        <Route path="/settings/groups/:groupId" element={<GroupInfo />} />
        <Route path="/settings/spaces" element={<Spaces />} />
        <Route path="/settings/sharing" element={<Shares />} />
        <Route
          path="/settings/webhooks"
          element={
            <Suspense fallback={null}>
              <WebhookSettingsPage />
            </Suspense>
          }
        />
        <Route
          path="/settings/api-keys"
          element={
            <Suspense fallback={null}>
              <ApiKeysPage />
            </Suspense>
          }
        />
        <Route
          path="/settings/audit-log"
          element={
            <Suspense fallback={null}>
              <AuditLogPage />
            </Suspense>
          }
        />
        <Route
          path="/settings/templates"
          element={
            <Suspense fallback={null}>
              <TemplatesPage />
            </Suspense>
          }
        />
        <Route
          path="/settings/taxonomy"
          element={
            <Suspense fallback={null}>
              <TaxonomyPage />
            </Suspense>
          }
        />
      </Route>

      {/* ✅ FALLBACK */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}
