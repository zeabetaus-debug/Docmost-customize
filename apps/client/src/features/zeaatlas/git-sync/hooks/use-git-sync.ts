import { gitSyncService } from "../services/git-sync-service";
import { GitSyncConfig } from "../types/git-sync.types";

export function useGitSync() {
  const exportToGit = async (spaceId: string, pages: any[]) => {
    return gitSyncService.exportSpace(spaceId, pages);
  };

  const importFromGit = async (config: GitSyncConfig) => {
    return gitSyncService.importSpace(config);
  };

  return {
    exportToGit,
    importFromGit,
  };
}
