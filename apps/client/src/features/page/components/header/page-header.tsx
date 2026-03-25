import classes from "./page-header.module.css";
import PageHeaderMenu from "@/features/page/components/header/page-header-menu.tsx";
import { Group } from "@mantine/core";
import Breadcrumb from "@/features/page/components/breadcrumbs/breadcrumb.tsx";
import StatusBadge from "@/features/zeaatlas/approval/StatusBadge";
import ApprovalActions from "@/features/zeaatlas/approval/ApprovalActions";
import { IPage } from "@/features/page/types/page.types";
import React from "react";

type StatusType = "draft" | "review" | "approved" | "archived";

interface Props {
  readOnly?: boolean;
  page?: IPage | null;
  status?: StatusType;
  setStatus?: React.Dispatch<React.SetStateAction<StatusType>>;

  // 🔥 ADD THIS
  setChangeRequests?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function PageHeader({
  readOnly,
  page,
  status,
  setStatus,
  setChangeRequests, // 👈 RECEIVE
}: Props) {
  const currentStatus: StatusType =
    page?.status || status || "draft";

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
        {/* LEFT SIDE */}
        <Group align="center" gap="sm">
          <Breadcrumb />
          <StatusBadge status={currentStatus} />
        </Group>

        {/* RIGHT SIDE */}
        <Group
          justify="flex-end"
          h="100%"
          px="md"
          wrap="nowrap"
          gap="var(--mantine-spacing-xs)"
        >
          {/* ✅ Pass down change request handler */}
          {page && setStatus && (
            <ApprovalActions
              page={page}
              onStatusChange={setStatus}
              setChangeRequests={setChangeRequests} // 👈 PASS HERE
            />
          )}

          {/* Edit control */}
          <PageHeaderMenu
            readOnly={readOnly || !isEditable}
          />
        </Group>
      </Group>
    </div>
  );
}