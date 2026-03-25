import { Alert, Center, Loader, Paper, Stack, Text, useComputedColorScheme } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { renderMermaid } from "../utils/mermaid-utils";

interface MermaidPreviewProps {
  code: string;
  previewRef: RefObject<HTMLDivElement | null>;
}

export function MermaidPreview({ code, previewRef }: MermaidPreviewProps) {
  const computedColorScheme = useComputedColorScheme();
  const [debouncedCode] = useDebouncedValue(code, 300);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function updatePreview() {
      setLoading(true);
      const result = await renderMermaid(
        debouncedCode,
        computedColorScheme === "light" ? "default" : "dark",
      );

      if (cancelled) {
        return;
      }

      setSvg(result.svg);
      setError(result.error);
      setLoading(false);
    }

    updatePreview();

    return () => {
      cancelled = true;
    };
  }, [debouncedCode, computedColorScheme]);

  return (
    <Paper withBorder radius="md" p="md" h="100%">
      <Stack gap="md" h="100%">
        <div>
          <Text fw={600}>Preview</Text>
          <Text size="sm" c="dimmed">
            Mermaid renders live as you type.
          </Text>
        </div>

        {loading ? (
          <Center mih={260}>
            <Loader size="sm" />
          </Center>
        ) : error ? (
          <Alert color="red" title="Invalid Mermaid diagram">
            {error}
          </Alert>
        ) : (
          <Center
            ref={previewRef}
            mih={260}
            p="md"
            style={{ overflow: "auto" }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </Stack>
    </Paper>
  );
}
