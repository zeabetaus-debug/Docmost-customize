import classes from "./page-header.module.css";
import PageHeaderMenu from "@/features/page/components/header/page-header-menu.tsx";
import { Group } from "@mantine/core";
import Breadcrumb from "@/features/page/components/breadcrumbs/breadcrumb.tsx";
import StatusBadge from "@/features/zeaatlas/approval/StatusBadge";
import ApprovalActions from "@/features/zeaatlas/approval/ApprovalActions";
import ChangeRequestIndicator from "@/features/zeaatlas/change-request/ChangeRequestIndicator";
import { IPage } from "@/features/page/types/page.types";
import React from "react";
import { IChangeRequest } from "@/features/zeaatlas/change-request/change-request.types";

type StatusType = "draft" | "review" | "approved" | "archived";

interface Props {
  readOnly?: boolean;
  page?: IPage | null;
  status?: StatusType;
  setStatus?: React.Dispatch<React.SetStateAction<StatusType>>;
  changeRequests?: IChangeRequest[];
  setChangeRequests?: React.Dispatch<React.SetStateAction<IChangeRequest[]>>;
}

export default function PageHeader({
  readOnly,
  page,
  status,
  setStatus,
  changeRequests,
  setChangeRequests,
}: Props) {
  const currentStatus: StatusType = page?.status || status || "draft";
  const isEditable = currentStatus === "draft";

  return (
    <div className={classes.header}>
      <Group
        justify="space-between"
        h="100%"
        px="md"
        wrap="nowrap"
        className={classes.group}
      >
        <Group align="center" gap="sm">
          <Breadcrumb />
          <StatusBadge status={currentStatus} />
        </Group>

        <Group
          justify="flex-end"
          h="100%"
          px="md"
          wrap="nowrap"
          gap="var(--mantine-spacing-xs)"
        >
          {page && setStatus && (
            <ApprovalActions
              page={page}
              onStatusChange={setStatus}
              setChangeRequests={setChangeRequests}
            />
          )}

          <ChangeRequestIndicator
            pageId={page?.id}
            pageTitle={page?.title}
            requests={changeRequests}
            onRequestsChange={setChangeRequests}
          />

          <PageHeaderMenu readOnly={readOnly || !isEditable} />
        </Group>
      </Group>
    </div>
  );
}
