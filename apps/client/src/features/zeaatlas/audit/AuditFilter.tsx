import React from "react";
import { Group, Select, TextInput, Button } from "@mantine/core";

export type ActionType = "edit" | "approve" | "reject" | "create" | "delete";

interface Props {
  users: string[];
  value: { action?: ActionType; user?: string; q?: string };
  onChange: (v: { action?: ActionType; user?: string; q?: string }) => void;
  onReset?: () => void;
}

export default function AuditFilter({ users, value, onChange, onReset }: Props) {
  return (
    <Group align="flex-end" gap="sm" wrap="wrap">
      {/* Action Filter */}
      <Select
        label="Action"
        placeholder="All"
        data={[
          { value: "", label: "All" },
          { value: "edit", label: "Edit" },
          { value: "approve", label: "Approve" },
          { value: "reject", label: "Reject" },
          { value: "create", label: "Create" },
          { value: "delete", label: "Delete" },
        ]}
        value={value.action ?? ""}
        onChange={(v) =>
          onChange({
            ...value,
            action: (v as ActionType) || undefined,
          })
        }
        style={{ minWidth: 160 }}
      />

      {/* User Filter */}
      <Select
        label="User"
        placeholder="All users"
        data={[
          { value: "", label: "All" },
          ...users.map((u) => ({ value: u, label: u })),
        ]}
        value={value.user ?? ""}
        onChange={(v) =>
          onChange({
            ...value,
            user: v || undefined,
          })
        }
        style={{ minWidth: 200 }}
      />

      {/* Search */}
      <TextInput
        label="Page name"
        placeholder="Search page name"
        value={value.q ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            q: e.currentTarget.value || undefined,
          })
        }
        style={{ minWidth: 240 }}
      />

      {/* Reset */}
      <Button
        variant="outline"
        onClick={() => {
          onChange({});
          onReset?.();
        }}
      >
        Reset
      </Button>
    </Group>
  );
}