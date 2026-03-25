import { Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { DiagramVersion } from "../types/diagram.types";
import { useMermaidDiagram } from "../hooks/use-mermaid-diagram";
import { MermaidEditor } from "../components/mermaid-editor";
import { MermaidPreview } from "../components/mermaid-preview";
import { VersionHistory } from "../components/version-history";
import { ExportControls } from "../components/export-controls";
import { DiagramLayout } from "../components/diagram-layout";
import { exportDiagramAsPng, exportDiagramAsSvg } from "../utils/export-utils";

export default function DiagramsPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { getDiagrams, saveVersion, updateDiagramTitle } = useMermaidDiagram();
  const diagrams = useMemo(() => getDiagrams(), [getDiagrams]);
  const activeDiagram = diagrams[0];

  const [title, setTitle] = useState(activeDiagram?.title ?? "Untitled Diagram");
  const [code, setCode] = useState(activeDiagram?.versions[0]?.code ?? "");
  const [versions, setVersions] = useState(activeDiagram?.versions ?? []);

  useEffect(() => {
    if (!activeDiagram) {
      return;
    }

    setTitle(activeDiagram.title);
    setCode(activeDiagram.versions[0]?.code ?? "");
    setVersions(activeDiagram.versions);
  }, [activeDiagram]);

  const handleSaveVersion = () => {
    if (!activeDiagram) {
      return;
    }

    setIsSaving(true);

    try {
      updateDiagramTitle(activeDiagram.id, title.trim() || "Untitled Diagram");
      const updated = saveVersion(activeDiagram.id, code);
      const current = updated.find((diagram) => diagram.id === activeDiagram.id);
      if (current) {
        setVersions(current.versions);
      }
      notifications.show({
        color: "green",
        message: "Diagram version saved",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = (version: DiagramVersion) => {
    setCode(version.code);
    notifications.show({
      color: "blue",
      message: "Version restored to editor",
    });
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    notifications.show({
      color: "green",
      message: "Diagram code copied",
    });
  };

  const handleExport = async (type: "png" | "svg") => {
    if (!previewRef.current) {
      notifications.show({
        color: "red",
        message: "Preview is not ready to export",
      });
      return;
    }

    setIsExporting(true);

    try {
      const safeName = (title.trim() || "diagram").toLowerCase().replace(/\s+/g, "-");
      if (type === "png") {
        await exportDiagramAsPng(previewRef.current, `${safeName}.png`);
      } else {
        exportDiagramAsSvg(previewRef.current, `${safeName}.svg`);
      }

      notifications.show({
        color: "green",
        message: `Diagram exported as ${type.toUpperCase()}`,
      });
    } catch (error) {
      notifications.show({
        color: "red",
        message:
          error instanceof Error ? error.message : "Failed to export diagram",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>Diagrams</Title>
            <Text c="dimmed" size="sm">
              Build Mermaid diagrams with live preview, local version history, and export tools.
            </Text>
          </div>
          <ExportControls
            onExportPng={() => void handleExport("png")}
            onExportSvg={() => handleExport("svg")}
            loading={isExporting}
          />
        </Group>

        <Paper withBorder radius="lg" p="md">
          <DiagramLayout
            toolbar={
              <Text size="sm" c="dimmed">
                Versions are stored locally in your browser and can be restored at any time.
              </Text>
            }
            editor={
              <MermaidEditor
                title={title}
                code={code}
                onCodeChange={setCode}
                onTitleChange={setTitle}
                onSaveVersion={handleSaveVersion}
                onCopyCode={() => void handleCopyCode()}
                isSaving={isSaving}
              />
            }
            preview={<MermaidPreview code={code} previewRef={previewRef} />}
            versions={
              <VersionHistory versions={versions} onRestore={handleRestoreVersion} />
            }
          />
        </Paper>
      </Stack>
    </Container>
  );
}
