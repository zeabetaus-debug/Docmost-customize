import React from "react";
import { AuditLog } from "@/features/zeaatlas/audit-log/types/audit-log.types";

const STORAGE_KEY = "zeaatlas_mock_audit_logs";

function generateMockLogs(): AuditLog[] {
  return [
    {
      id: crypto.randomUUID(),
      user: "Dhanush",
      action: "page_updated",
      entity: "Project Docs",
      space: "Engineering",
      timestamp: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      user: "Admin",
      action: "page_viewed",
      entity: "Client SOP",
      space: "Client Docs",
      timestamp: new Date().toISOString(),
    },
  ];
}

export function useMockAuditLog() {
  const getLogs = React.useCallback(() => {
    if (typeof window === "undefined") return [];

    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) {
        const mock = generateMockLogs();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
        return mock;
      }

      return JSON.parse(data) as AuditLog[];
    } catch (error) {
      console.error("Failed to read mock audit logs", error);
      return [];
    }
  }, []);

  return { getLogs };
}
