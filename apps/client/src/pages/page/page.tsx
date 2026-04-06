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
import { Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { useChangeRequestsState } from "@/features/zeaatlas/change-request/use-change-requests-state";
import usePermission from "@/hooks/use-permission";
import { useAtomValue } from "jotai";
import { clientModeAtom } from "@/store/client-store";

const MemoizedFullEditor = React.memo(FullEditor);
const MemoizedPageHeader = React.memo(PageHeader);
const MemoizedHistoryModal = React.memo(HistoryModal);

type StatusType = "draft" | "review" | "approved" | "archived";

export default function Page() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const isClientMode = useAtomValue(clientModeAtom);

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
      <PageContent pageSlug={pageSlug} isClientMode={isClientMode} />
    </ErrorBoundary>
  );
}

function PageContent({
  pageSlug,
  isClientMode,
}: {
  pageSlug: string | undefined;
  isClientMode: boolean;
}) {
  const { t } = useTranslation();
  const permission = usePermission();

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });

  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const canEdit = (page?.permissions?.canEdit ?? false) && permission.canEdit;
  const [status, setStatus] = React.useState<StatusType>("draft");
  const [changeRequests, setChangeRequests] = useChangeRequestsState(page?.id);

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

      <MemoizedPageHeader
        readOnly={
          !canEdit ||
          status === "approved" ||
          permission.isReadOnly ||
          isClientMode // 🔥 ADD HERE ALSO (extra safety)
        }
        page={page}
        status={status}
        setStatus={setStatus}
        changeRequests={changeRequests}
        setChangeRequests={setChangeRequests}
      />

      <MemoizedFullEditor
        key={page.id}
        pageId={page.id}
        title={page.title}
        content={page.content}
        slugId={page.slugId}
        spaceSlug={page.space?.slug}
        editable={
          canEdit &&
          status !== "approved" &&
          !permission.isReadOnly &&
          !isClientMode // 🔥 MAIN FIX
        }
      />

      <MemoizedHistoryModal pageId={page.id} />
    </div>
  );
}