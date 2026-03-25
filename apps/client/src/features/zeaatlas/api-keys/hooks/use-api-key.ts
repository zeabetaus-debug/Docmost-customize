import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zeaatlas_api_key";

type ApiKeyState = {
  apiKey: string | null;
};

let apiKeyState: ApiKeyState = {
  apiKey:
    typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEY)
      : null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return apiKeyState;
}

function persistApiKey(value: string | null) {
  if (typeof window === "undefined") return;

  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function setStoredApiKey(apiKey: string) {
  apiKeyState = { apiKey };
  persistApiKey(apiKey);
  emitChange();
}

export function clearStoredApiKey() {
  apiKeyState = { apiKey: null };
  persistApiKey(null);
  emitChange();
}

export function getStoredApiKey() {
  return apiKeyState.apiKey;
}

export default function useApiKey() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    apiKey: state.apiKey,
    isApiKeyMode: Boolean(state.apiKey),
    setApiKey: setStoredApiKey,
    clearApiKey: clearStoredApiKey,
  };
}
