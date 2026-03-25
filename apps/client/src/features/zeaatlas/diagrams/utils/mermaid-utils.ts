import mermaid from "mermaid";

export const DEFAULT_MERMAID_CODE = `graph TD
A[Start] --> B[Process]
B --> C[End]`;

let mermaidInitialized = false;

function ensureMermaidInitialized(theme: "default" | "dark") {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme,
    });
    mermaidInitialized = true;
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    theme,
  });
}

export async function renderMermaid(
  code: string,
  theme: "default" | "dark" = "default",
) {
  ensureMermaidInitialized(theme);

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return {
      svg: "",
      error: "Diagram code is empty.",
    };
  }

  try {
    const id = `zeaatlas-mermaid-${crypto.randomUUID()}`;
    const { svg } = await mermaid.render(id, trimmedCode);
    return {
      svg,
      error: null,
    };
  } catch (error) {
    return {
      svg: "",
      error: error instanceof Error ? error.message : "Invalid Mermaid diagram.",
    };
  }
}
