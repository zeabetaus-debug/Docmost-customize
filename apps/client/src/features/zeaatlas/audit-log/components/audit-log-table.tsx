import React from "react";
import { Pagination, Table, Text } from "@mantine/core";
import { AuditLog } from "@/features/zeaatlas/audit-log/types/audit-log.types";
import AuditLogRow from "@/features/zeaatlas/audit-log/components/audit-log-row";

interface AuditLogTableProps {
  logs: AuditLog[];
}

const PAGE_SIZE = 10;

export default function AuditLogTable({ logs }: AuditLogTableProps) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [logs]);

  if (logs.length === 0) {
    return (
      <Text c="dimmed" ta="center">
        {"\uD83D\uDCEC"} No audit activity found
      </Text>
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
  const pageLogs = sortedLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Table.ScrollContainer minWidth={700}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Entity</Table.Th>
              <Table.Th>Space</Table.Th>
              <Table.Th>Timestamp</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pageLogs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <Pagination mt="md" value={page} onChange={setPage} total={totalPages} />
      )}
    </>
  );
}
