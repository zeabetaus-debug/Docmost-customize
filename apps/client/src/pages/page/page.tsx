import { useParams } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query";
import { FullEditor } from "@/features/editor/full-editor";
import HistoryModal from "@/features/page-history/components/history-modal";
import { Helmet } from "react-helmet-async";
import PageHeader from "@/features/page/components/header/page-header.tsx";
import { extractPageSlugId } from "@/lib";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTranslation } from "react-i18next";
import React from "react";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { IconAlertTriangle, IconFileOff } from "@tabler/icons-react";
import { Button, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

const MemoizedFullEditor = React.memo(FullEditor);
const MemoizedPageHeader = React.memo(PageHeader);
const MemoizedHistoryModal = React.memo(HistoryModal);

type StatusType = "draft" | "review" | "approved" | "archived";

export default function Page() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();

  return (
    <ErrorBoundary
      resetKeys={[pageSlug]}
      fallbackRender={({ resetErrorBoundary }) => (
        <EmptyState
          icon={IconAlertTriangle}
          title={t("Failed to load page. An error occurred.")}
          action={
            <Button variant="default" size="sm" mt="xs" onClick={resetErrorBoundary}>
              {t("Try again")}
            </Button>
          }
        />
      )}
    >
      <PageContent pageSlug={pageSlug} />
    </ErrorBoundary>
  );
}

function PageContent({ pageSlug }: { pageSlug: string | undefined }) {
  const { t } = useTranslation();

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });

  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const canEdit = page?.permissions?.canEdit ?? false;

  // ✅ Approval Workflow State
  const [status, setStatus] = React.useState<StatusType>("draft");

  // ✅ Change Requests State (CORRECT PLACE)
  const [changeRequests, setChangeRequests] = React.useState<string[]>([]);

  // 🔁 Sync with backend
  React.useEffect(() => {
    if (page?.status) {
      setStatus(page.status as StatusType);
    }
  }, [page?.status]);

  if (isLoading) return null;

  if (isError || !page) {
    if ([401, 403, 404].includes(error?.["status"])) {
      return (
        <EmptyState
          icon={IconFileOff}
          title={t("Page not found")}
          description={t(
            "This page may have been deleted, moved, or you may not have access."
          )}
          action={
            <Button component={Link} to="/home" variant="default" size="sm" mt="xs">
              {t("Go to homepage")}
            </Button>
          }
        />
      );
    }

    return <EmptyState icon={IconFileOff} title={t("Error fetching page data.")} />;
  }

  if (!space) return null;

  return (
    <div>
      <Helmet>
        <title>{`${page.icon || ""} ${page.title || t("untitled")}`}</title>
      </Helmet>

      {/* ✅ HEADER */}
      <MemoizedPageHeader
        readOnly={!canEdit || status === "approved"}
        page={page}
        status={status}
        setStatus={setStatus}
        setChangeRequests={setChangeRequests} // 🔥 PASS DOWN
      />

      {/* Editor */}
      <MemoizedFullEditor
        key={page.id}
        pageId={page.id}
        title={page.title}
        content={page.content}
        slugId={page.slugId}
        spaceSlug={page.space?.slug}
        editable={canEdit && status !== "approved"}
      />

      {/* ✅ SHOW CHANGE REQUESTS (REAL DATA) */}
      {changeRequests.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {changeRequests.map((req, i) => (
            <Text key={i} size="sm" c="yellow">
              🔁 {req}
            </Text>
          ))}
        </div>
      )}

      {/* History */}
      <MemoizedHistoryModal pageId={page.id} />
    </div>
  );
}