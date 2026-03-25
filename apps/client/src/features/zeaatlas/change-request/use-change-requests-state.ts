import React from "react";
import { IChangeRequest } from "@/features/zeaatlas/change-request/change-request.types";

const STORAGE_KEY = "zeaatlas.changeRequests";

function readStoredRequests(pageId?: string) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as IChangeRequest[];
    if (!Array.isArray(parsed)) return [];

    return pageId
      ? parsed.filter((request) => request.pageId === pageId)
      : parsed;
  } catch (error) {
    console.error("Failed to read change requests from localStorage", error);
    return [];
  }
}

export function useChangeRequestsState(pageId?: string) {
  const [changeRequests, setChangeRequests] = React.useState<IChangeRequest[]>(
    () => readStoredRequests(pageId),
  );

  React.useEffect(() => {
    setChangeRequests(readStoredRequests(pageId));
  }, [pageId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as IChangeRequest[]) : [];
      const otherPages = parsed.filter((request) => request.pageId !== pageId);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...otherPages, ...changeRequests]),
      );
    } catch (error) {
      console.error("Failed to store change requests in localStorage", error);
    }
  }, [changeRequests, pageId]);

  return [changeRequests, setChangeRequests] as const;
}
