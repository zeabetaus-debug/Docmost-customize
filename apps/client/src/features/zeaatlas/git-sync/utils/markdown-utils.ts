import { MarkdownFilePayload } from "../types/git-sync.types";

function sanitizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function convertPageToMarkdown(page: any): string {
  const title = typeof page?.title === "string" ? page.title : "Untitled";
  const content =
    typeof page?.content === "string"
      ? page.content
      : JSON.stringify(page?.content ?? "", null, 2);

  return `# ${title}\n\n${content}`.trimEnd();
}

export function convertPagesToMarkdown(pages: any[]): MarkdownFilePayload[] {
  return pages.map((page, index) => {
    const title =
      typeof page?.title === "string" && page.title.trim()
        ? page.title
        : `page-${index + 1}`;

    return {
      filename: `${sanitizeFilenamePart(title) || `page-${index + 1}`}.md`,
      content: convertPageToMarkdown(page),
    };
  });
}
