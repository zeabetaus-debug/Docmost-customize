import React from "react";
import { ApiKey } from "@/features/zeaatlas/api-keys/types/api-key.types";

const STORAGE_KEY = "zeaatlas_mock_api_keys";

function readKeys(): ApiKey[] {
  if (typeof window === "undefined") return [];

  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read mock API keys", error);
    return [];
  }
}

function writeKeys(keys: ApiKey[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function useMockApiKeys() {
  const [keys, setKeys] = React.useState<ApiKey[]>(() => readKeys());

  const getKeys = React.useCallback(() => {
    const stored = readKeys();
    setKeys(stored);
    return stored;
  }, []);

  const saveKeys = React.useCallback((nextKeys: ApiKey[]) => {
    writeKeys(nextKeys);
    setKeys(nextKeys);
  }, []);

  const createKey = React.useCallback(
    (name: string, scopes: string[]) => {
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name,
        key: "zk_live_" + Math.random().toString(36).substring(2, 12),
        scopes,
        createdAt: new Date().toISOString(),
      };

      const nextKeys = [newKey, ...readKeys()];
      saveKeys(nextKeys);
      return newKey;
    },
    [saveKeys],
  );

  const deleteKey = React.useCallback(
    (id: string) => {
      const nextKeys = readKeys().filter((key) => key.id !== id);
      saveKeys(nextKeys);
    },
    [saveKeys],
  );

  return {
    keys,
    getKeys,
    createKey,
    deleteKey,
  };
}
