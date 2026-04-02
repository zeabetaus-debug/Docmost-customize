import React from "react";
import { IChangeRequest } from "@/features/zeaatlas/change-request/change-request.types";

const STORAGE_KEY = "zeaatlas.changeRequests";

// ✅ MAX STORAGE SIZE (~2MB safe limit)
const MAX_STORAGE_SIZE = 2_000_000;

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
    console.error("❌ Failed to read change requests", error);
    return [];
  }
}

export function useChangeRequestsState(pageId?: string) {
  const [changeRequests, setChangeRequests] = React.useState<IChangeRequest[]>(
    () => readStoredRequests(pageId),
  );

  // ✅ reload when page changes
  React.useEffect(() => {
    setChangeRequests(readStoredRequests(pageId));
  }, [pageId]);

  // ✅ SAFE STORAGE FIX
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as IChangeRequest[]) : [];

      // ✅ remove old data for this page
      const otherPages = parsed.filter(
        (request) => request.pageId !== pageId
      );

      // ✅ LIMIT DATA SIZE (keep only latest 50)
      const limitedRequests = changeRequests.slice(-50);

      const finalData = [...otherPages, ...limitedRequests];

      const serialized = JSON.stringify(finalData);

      // ✅ SIZE PROTECTION
      if (serialized.length > MAX_STORAGE_SIZE) {
        console.warn("⚠️ Storage too large, clearing old data");

        // fallback → keep only latest 20
        const trimmed = finalData.slice(-20);

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(trimmed)
        );
      } else {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch (error) {
      console.error("❌ Failed to store change requests", error);

      // ✅ HARD RESET (prevents crash loop)
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [changeRequests, pageId]);

  return [changeRequests, setChangeRequests] as const;
}