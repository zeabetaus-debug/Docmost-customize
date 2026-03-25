import React from "react";
import { Badge, Table } from "@mantine/core";
import { AuditLog } from "@/features/zeaatlas/audit-log/types/audit-log.types";
import {
  formatTimestamp,
  getAuditActionColor,
} from "@/features/zeaatlas/audit-log/utils/audit-log-utils";

interface AuditLogRowProps {
  log: AuditLog;
}

export default function AuditLogRow({ log }: AuditLogRowProps) {
  return (
    <Table.Tr>
      <Table.Td>{log.user}</Table.Td>
      <Table.Td>
        <Badge color={getAuditActionColor(log.action)} variant="light">
          {log.action}
        </Badge>
      </Table.Td>
      <Table.Td>{log.entity}</Table.Td>
      <Table.Td>{log.space || "-"}</Table.Td>
      <Table.Td>{formatTimestamp(log.timestamp)}</Table.Td>
    </Table.Tr>
  );
}
