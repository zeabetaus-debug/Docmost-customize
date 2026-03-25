import React from "react";
import { Template } from "@/features/zeaatlas/templates/types/template.types";

const STORAGE_KEY = "zeaatlas_mock_templates";

function readTemplates(): Template[] {
  if (typeof window === "undefined") return [];

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read templates", error);
    return [];
  }
}

function writeTemplates(templates: Template[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function useMockTemplates() {
  const [templates, setTemplates] = React.useState<Template[]>(() => readTemplates());

  const getTemplates = React.useCallback(() => {
    const stored = readTemplates();
    setTemplates(stored);
    return stored;
  }, []);

  const saveTemplates = React.useCallback((nextTemplates: Template[]) => {
    writeTemplates(nextTemplates);
    setTemplates(nextTemplates);
  }, []);

  const createTemplate = React.useCallback(
    (template: Omit<Template, "id" | "createdAt">) => {
      const newTemplate: Template = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const nextTemplates = [newTemplate, ...readTemplates()];
      saveTemplates(nextTemplates);
      return newTemplate;
    },
    [saveTemplates],
  );

  const updateTemplate = React.useCallback(
    (id: string, template: Omit<Template, "id" | "createdAt">) => {
      const nextTemplates = readTemplates().map((item) =>
        item.id === id ? { ...item, ...template } : item,
      );
      saveTemplates(nextTemplates);
      return nextTemplates.find((item) => item.id === id) || null;
    },
    [saveTemplates],
  );

  const getTemplateById = React.useCallback((id?: string | null) => {
    if (!id) return null;
    return readTemplates().find((template) => template.id === id) || null;
  }, []);

  const deleteTemplate = React.useCallback(
    (id: string) => {
      const nextTemplates = readTemplates().filter((template) => template.id !== id);
      saveTemplates(nextTemplates);
    },
    [saveTemplates],
  );

  return {
    templates,
    getTemplates,
    createTemplate,
    updateTemplate,
    getTemplateById,
    deleteTemplate,
  };
}
