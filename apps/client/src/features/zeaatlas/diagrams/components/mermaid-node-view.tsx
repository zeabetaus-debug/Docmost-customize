import { useComputedColorScheme } from "@mantine/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { useEffect, useState } from "react";
import { renderMermaid } from "../utils/mermaid-utils";

export default function MermaidNodeView(props: NodeViewProps) {
  const computedColorScheme = useComputedColorScheme();
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const code = props.node.textContent;

  useEffect(() => {
    let cancelled = false;

    async function updatePreview() {
      const result = await renderMermaid(
        code,
        computedColorScheme === "light" ? "default" : "dark",
      );

      if (cancelled) {
        return;
      }

      setPreview(result.svg);
      setError(result.error);
    }

    void updatePreview();

    return () => {
      cancelled = true;
    };
  }, [code, computedColorScheme]);

  return (
    <NodeViewWrapper
      as="div"
      data-type="mermaid"
      style={{
        border: "1px solid var(--mantine-color-dark-4)",
        borderRadius: "12px",
        margin: "12px 0",
        overflow: "hidden",
      }}
    >
      <div
        contentEditable={false}
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--mantine-color-dark-4)",
          background: "var(--mantine-color-dark-6)",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--mantine-color-gray-4)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Mermaid Diagram
      </div>

      <div
        contentEditable={false}
        style={{
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          overflow: "auto",
        }}
      >
        {error ? (
          <div style={{ color: "var(--mantine-color-red-5)", fontSize: "14px" }}>
            Invalid Mermaid diagram: {error}
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: preview }} />
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--mantine-color-dark-4)",
          background: "var(--mantine-color-dark-7)",
          padding: "12px 14px",
        }}
      >
        <NodeViewContent
          as="div"
          style={{
            whiteSpace: "pre-wrap",
            fontFamily:
              "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, monospace",
            fontSize: "13px",
            lineHeight: 1.6,
            outline: "none",
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}
