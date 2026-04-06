import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

export default function SheetsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const spaceId = params.get("spaceId");
    return spaceId
      ? `http://localhost:5175?spaceId=${encodeURIComponent(spaceId)}`
      : "http://localhost:5175";
  }, [location.search]);

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; pageSlugId?: string; pageId?: string }
        | undefined;
      if (data?.type !== "excel-sheet-saved") {
        return;
      }

      console.log("Refetching pages...");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["root-sidebar-pages"] }),
        queryClient.invalidateQueries({ queryKey: ["sidebar-pages"] }),
        queryClient.invalidateQueries({ queryKey: ["pages"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces"] }),
      ]);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["root-sidebar-pages"] }),
        queryClient.refetchQueries({ queryKey: ["sidebar-pages"] }),
        queryClient.refetchQueries({ queryKey: ["pages"] }),
      ]);

      console.log("Sidebar updated successfully");
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [queryClient]);

  return (
    <div
      style={{
        width: "100%",
        height: "calc(111vh - 60px)", // ✅ IMPORTANT FIX
        overflow: "hidden",
      }}
    >
      <iframe
        src={iframeSrc}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}
