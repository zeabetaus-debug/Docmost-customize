import { ExportPayload, GitSyncConfig } from "../types/git-sync.types";

async function parseGitSyncResponse(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Git sync request failed");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const gitSyncApi = {
  exportToGit: async (payload: ExportPayload) => {
    const response = await fetch("/api/zeaatlas/git/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    return parseGitSyncResponse(response);
  },

  importFromGit: async (config: GitSyncConfig) => {
    const response = await fetch("/api/zeaatlas/git/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(config),
    });

    return parseGitSyncResponse(response);
  },
};
