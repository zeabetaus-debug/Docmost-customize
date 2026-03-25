import { UserRole } from "@/lib/types";
import { IUser } from "@/features/user/types/user.types";
import {
  ChangeRequestStatus,
  IChangeRequest,
} from "@/features/zeaatlas/change-request/change-request.types";

export function formatChangeRequestTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function canManageChangeRequests(role?: string | null) {
  return role === UserRole.ADMIN || role === UserRole.OWNER || role === "reviewer";
}

export function createLocalChangeRequest(params: {
  content: any;
  pageId?: string;
  user?: IUser | null;
}): IChangeRequest {
  return {
    id: crypto.randomUUID(),
    pageId: params.pageId,
    content: params.content,
    status: "pending",
    createdAt: new Date().toISOString(),
    isReal: true,
    isLocalOnly: true,
    createdBy: params.user?.id ?? "",
    requestedBy: {
      id: params.user?.id ?? null,
      name: params.user?.name ?? "Unknown user",
    },
  };
}

export function getChangeRequestStatusColor(status: ChangeRequestStatus) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "yellow";
}

function collectText(node: any): string[] {
  if (!node) return [];

  if (typeof node === "string") {
    return [node];
  }

  if (typeof node.text === "string") {
    return [node.text];
  }

  if (!Array.isArray(node.content)) {
    return [];
  }

  return node.content.flatMap((child) => collectText(child));
}

export function getChangeRequestPreview(content: any) {
  const preview = collectText(content).join(" ").replace(/\s+/g, " ").trim();
  return preview || "No preview";
}

export function hasValidChangeRequestContent(content: any) {
  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  return getChangeRequestPreview(content) !== "No preview";
}
