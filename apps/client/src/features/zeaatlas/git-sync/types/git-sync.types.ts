export interface GitSyncConfig {
  repoUrl: string;
  branch: string;
  spaceId: string;
  token?: string;
}

export interface MarkdownFilePayload {
  filename: string;
  content: string;
}

export interface ExportPayload {
  spaceId: string;
  pages: MarkdownFilePayload[];
}
