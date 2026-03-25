import React from "react";
import { TaxonomyItem } from "@/features/zeaatlas/taxonomy/types/taxonomy.types";

const STORAGE_KEY = "zeaatlas_mock_taxonomy";

function readItems(): TaxonomyItem[] {
  if (typeof window === "undefined") return [];

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read taxonomy items", error);
    return [];
  }
}

function writeItems(items: TaxonomyItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useMockTaxonomy() {
  const [items, setItems] = React.useState<TaxonomyItem[]>(() => readItems());

  const getItems = React.useCallback(() => {
    const stored = readItems();
    setItems(stored);
    return stored;
  }, []);

  const saveItems = React.useCallback((nextItems: TaxonomyItem[]) => {
    writeItems(nextItems);
    setItems(nextItems);
  }, []);

  const addItem = React.useCallback(
    (item: Omit<TaxonomyItem, "id" | "createdAt">) => {
      const newItem: TaxonomyItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const nextItems = [newItem, ...readItems()];
      saveItems(nextItems);
      return newItem;
    },
    [saveItems],
  );

  const deleteItem = React.useCallback(
    (id: string) => {
      const nextItems = readItems().filter((item) => item.id !== id);
      saveItems(nextItems);
    },
    [saveItems],
  );

  return { items, getItems, addItem, deleteItem };
}
