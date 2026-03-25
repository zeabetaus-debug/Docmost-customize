import React from "react";
import { Button, Container, Group, Paper, Stack, Title } from "@mantine/core";
import { Helmet } from "react-helmet-async";
import { notifications } from "@mantine/notifications";
import { getAppName } from "@/lib/config";
import { useMockAuditLog } from "@/features/zeaatlas/audit-log/hooks/use-mock-audit-log";
import {
  AuditLogFilters,
} from "@/features/zeaatlas/audit-log/types/audit-log.types";
import AuditLogFiltersComponent from "@/features/zeaatlas/audit-log/components/audit-log-filters";
import AuditLogTable from "@/features/zeaatlas/audit-log/components/audit-log-table";
import {
  exportLogsToCsv,
  filterLogs,
} from "@/features/zeaatlas/audit-log/utils/audit-log-utils";

const INITIAL_FILTERS: AuditLogFilters = {
  user: "",
  action: null,
  space: "",
  fromDate: null,
  toDate: null,
};

export default function AuditLogPage() {
  const { getLogs } = useMockAuditLog();
  const [filters, setFilters] = React.useState<AuditLogFilters>(INITIAL_FILTERS);
  const [logs] = React.useState(() => getLogs());

  const filteredLogs = React.useMemo(
    () => filterLogs(logs, filters),
    [filters, logs],
  );

  const handleExport = () => {
    const csv = exportLogsToCsv(filteredLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit-log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifications.show({ message: "Audit log exported", color: "green" });
  };

  return (
    <Container size="xl" py="xl">
      <Helmet>
        <title>{`Audit Log - ${getAppName()}`}</title>
      </Helmet>

      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Audit Log</Title>
          <Button onClick={handleExport}>Export CSV</Button>
        </Group>

        <Paper withBorder radius="md" p="md">
          <AuditLogFiltersComponent filters={filters} onChange={setFilters} />
        </Paper>

        <Paper withBorder radius="md" p="md">
          <AuditLogTable logs={filteredLogs} />
        </Paper>
      </Stack>
    </Container>
  );
}
