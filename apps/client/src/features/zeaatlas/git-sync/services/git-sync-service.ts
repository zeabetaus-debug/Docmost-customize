import { gitSyncApi } from "../api/git-sync-api";
import { GitSyncConfig } from "../types/git-sync.types";
import { convertPagesToMarkdown } from "../utils/markdown-utils";

export const gitSyncService = {
  exportSpace: async (spaceId: string, pages: any[]) => {
    const markdownFiles = convertPagesToMarkdown(pages);

    return gitSyncApi.exportToGit({
      spaceId,
      pages: markdownFiles,
    });
  },

  importSpace: async (config: GitSyncConfig) => {
    return gitSyncApi.importFromGit(config);
  },
};
