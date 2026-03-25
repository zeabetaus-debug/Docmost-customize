import { useCallback } from "react";
import { Diagram, DiagramVersion } from "../types/diagram.types";
import { DEFAULT_MERMAID_CODE } from "../utils/mermaid-utils";

const STORAGE_KEY = "zeaatlas_diagrams";

function createDefaultVersion(): DiagramVersion {
  return {
    id: crypto.randomUUID(),
    code: DEFAULT_MERMAID_CODE,
    createdAt: new Date().toISOString(),
  };
}

function createDefaultDiagram(): Diagram {
  return {
    id: crypto.randomUUID(),
    title: "Untitled Diagram",
    versions: [createDefaultVersion()],
  };
}

export function useMermaidDiagram() {
  const getDiagrams = useCallback((): Diagram[] => {
    const data = window.localStorage.getItem(STORAGE_KEY);

    if (!data) {
      const fallback = [createDefaultDiagram()];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    try {
      const parsed = JSON.parse(data) as Diagram[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall back to a clean local default if storage is corrupted.
    }

    const fallback = [createDefaultDiagram()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }, []);

  const saveDiagrams = useCallback((diagrams: Diagram[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
  }, []);

  const saveVersion = useCallback(
    (diagramId: string, code: string) => {
      const diagrams = getDiagrams();

      const updated = diagrams.map((diagram) => {
        if (diagram.id !== diagramId) {
          return diagram;
        }

        return {
          ...diagram,
          versions: [
            {
              id: crypto.randomUUID(),
              code,
              createdAt: new Date().toISOString(),
            },
            ...diagram.versions,
          ],
        };
      });

      saveDiagrams(updated);
      return updated;
    },
    [getDiagrams, saveDiagrams],
  );

  const updateDiagramTitle = useCallback(
    (diagramId: string, title: string) => {
      const diagrams = getDiagrams();
      const updated = diagrams.map((diagram) =>
        diagram.id === diagramId ? { ...diagram, title } : diagram,
      );

      saveDiagrams(updated);
      return updated;
    },
    [getDiagrams, saveDiagrams],
  );

  return {
    getDiagrams,
    saveDiagrams,
    saveVersion,
    updateDiagramTitle,
  };
}
