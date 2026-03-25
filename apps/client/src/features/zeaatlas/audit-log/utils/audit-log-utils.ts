import { BadgeProps } from "@mantine/core";
import { AuditLog, AuditLogFilters } from "@/features/zeaatlas/audit-log/types/audit-log.types";

export function filterLogs(logs: AuditLog[], filters: AuditLogFilters) {
  return logs.filter((log) => {
    const matchesUser = filters.user
      ? log.user.toLowerCase().includes(filters.user.toLowerCase())
      : true;
    const matchesAction = filters.action ? log.action === filters.action : true;
    const matchesSpace = filters.space
      ? (log.space || "").toLowerCase().includes(filters.space.toLowerCase())
      : true;
    const logTime = new Date(log.timestamp).getTime();
    const matchesFrom = filters.fromDate
      ? logTime >= new Date(filters.fromDate).getTime()
      : true;
    const matchesTo = filters.toDate
      ? logTime <= new Date(filters.toDate).getTime()
      : true;

    return matchesUser && matchesAction && matchesSpace && matchesFrom && matchesTo;
  });
}

export function getAuditActionColor(action: string): BadgeProps["color"] {
  if (action.includes("deleted")) return "red";
  if (action.includes("approved")) return "green";
  if (action.includes("updated")) return "blue";
  if (action.includes("exported")) return "orange";
  return "gray";
}

export function formatTimestamp(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function exportLogsToCsv(logs: AuditLog[]) {
  const header = ["User", "Action", "Entity", "Space", "Timestamp"];
  const rows = logs.map((log) => [
    log.user,
    log.action,
    log.entity,
    log.space || "",
    log.timestamp,
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
