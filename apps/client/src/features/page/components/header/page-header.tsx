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

// ✅ KEEP THIS (no change)
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";

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

  const [currentUser] = useAtom(currentUserAtom);
  const isClientMode = currentUser?.user?.clientMode === true;

  // ✅ FINAL READ-ONLY (MASTER CONTROL)
  const finalReadOnly = isClientMode || readOnly || !isEditable;

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
          {/* ❌ DISABLE IN CLIENT MODE OR READONLY */}
          {!finalReadOnly && page && setStatus && (
            <ApprovalActions
              page={page}
              onStatusChange={setStatus}
              requests={changeRequests}
              setChangeRequests={setChangeRequests}
            />
          )}

          {/* ❌ DISABLE IN CLIENT MODE OR READONLY */}
          {!finalReadOnly && (
            <ChangeRequestIndicator
              pageId={page?.id}
              pageTitle={page?.title}
              requests={changeRequests}
              onRequestsChange={setChangeRequests}
            />
          )}

          {/* 🔥 CRITICAL FIX */}
          <PageHeaderMenu readOnly={finalReadOnly} />
        </Group>
      </Group>
    </div>
  );
}