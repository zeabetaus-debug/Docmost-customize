export interface AuditLog {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId?: string;
  space?: string;
  timestamp: string;
}

export interface AuditLogFilters {
  user: string;
  action: string | null;
  space: string;
  fromDate: string | null;
  toDate: string | null;
}
