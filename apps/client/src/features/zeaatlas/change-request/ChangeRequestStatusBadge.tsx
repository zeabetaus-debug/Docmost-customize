import { Badge } from "@mantine/core";
import {
  ChangeRequestStatus,
} from "@/features/zeaatlas/change-request/change-request.types";
import { getChangeRequestStatusColor } from "@/features/zeaatlas/change-request/change-request.utils";

interface ChangeRequestStatusBadgeProps {
  status: ChangeRequestStatus;
}

export default function ChangeRequestStatusBadge({
  status,
}: ChangeRequestStatusBadgeProps) {
  return (
    <Badge color={getChangeRequestStatusColor(status)} variant="light">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
