import React from "react";
import { Group, Select, Stack, TextInput } from "@mantine/core";
import { AuditLogFilters } from "@/features/zeaatlas/audit-log/types/audit-log.types";

interface AuditLogFiltersProps {
  filters: AuditLogFilters;
  onChange: (filters: AuditLogFilters) => void;
}

const ACTION_OPTIONS = [
  "page_viewed",
  "page_created",
  "page_updated",
  "page_approved",
  "page_exported",
];

export default function AuditLogFiltersComponent({
  filters,
  onChange,
}: AuditLogFiltersProps) {
  return (
    <Stack gap="sm">
      <Group grow align="flex-end">
        <TextInput
          label="User"
          placeholder="Filter by user"
          value={filters.user}
          onChange={(event) =>
            onChange({ ...filters, user: event.currentTarget.value })
          }
        />

        <Select
          label="Action"
          placeholder="All actions"
          clearable
          data={ACTION_OPTIONS}
          value={filters.action}
          onChange={(value) => onChange({ ...filters, action: value })}
        />

        <TextInput
          label="Space"
          placeholder="Filter by space"
          value={filters.space}
          onChange={(event) =>
            onChange({ ...filters, space: event.currentTarget.value })
          }
        />
      </Group>

      <Group grow>
        <TextInput
          label="From"
          type="date"
          value={filters.fromDate || ""}
          onChange={(event) =>
            onChange({
              ...filters,
              fromDate: event.currentTarget.value || null,
            })
          }
        />

        <TextInput
          label="To"
          type="date"
          value={filters.toDate || ""}
          onChange={(event) =>
            onChange({
              ...filters,
              toDate: event.currentTarget.value || null,
            })
          }
        />
      </Group>
    </Stack>
  );
}
