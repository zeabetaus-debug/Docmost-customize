import React from "react";
import { Badge } from "@mantine/core";

export type PageStatus = "draft" | "review" | "approved" | "archived";

const colorMap: Record<PageStatus, string> = {
  draft: "gray",
  review: "yellow",
  approved: "green",
  archived: "red",
};

const labelMap: Record<PageStatus, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  archived: "Archived",
};

interface Props {
  status?: PageStatus;
}

export default function StatusBadge({ status }: Props) {
  const safeStatus: PageStatus = status ?? "draft";

  return (
    <Badge
      color={colorMap[safeStatus]}
      variant="filled"
      style={{ textTransform: "uppercase", fontWeight: 600 }}
    >
      {labelMap[safeStatus]}
    </Badge>
  );
}