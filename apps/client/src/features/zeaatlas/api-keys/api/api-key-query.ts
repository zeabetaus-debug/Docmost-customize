import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";

/* =====================================================
   ✅ API KEY TYPES
===================================================== */
import {
  IApiKey,
  IApiKeyInput,
  IApiKeyValidationInput,
  IApiKeyValidationResult,
} from "@/features/zeaatlas/api-keys/types/api-key.types";

import {
  apiKeyFetch,
  deleteWithApiKey,
  getWithApiKey,
  postWithApiKey,
} from "@/features/zeaatlas/api-keys/services/api-key-client";

/* =====================================================
   ✅ WEBHOOK TYPE (ADD THIS)
===================================================== */
export interface IWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

/* =====================================================
   ✅ QUERY KEYS
===================================================== */
const API_KEY_QUERY_KEY = ["zeaatlas-api-keys"];
const WEBHOOK_QUERY_KEY = ["zeaatlas-webhooks"];

/* =====================================================
   ✅ API KEY FUNCTIONS (NO CHANGE)
===================================================== */
async function getApiKeys() {
  return getWithApiKey<IApiKey[]>("/api/zeaatlas/api-keys");
}

async function createApiKey(input: IApiKeyInput) {
  return postWithApiKey<IApiKey>("/api/zeaatlas/api-keys", input);
}

async function deleteApiKey(id: string) {
  return deleteWithApiKey<void>(`/api/zeaatlas/api-keys/${id}`);
}

async function validateApiKey(input: IApiKeyValidationInput) {
  return apiKeyFetch<IApiKeyValidationResult>(
    "/api/zeaatlas/api-keys/validate",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

/* =====================================================
   ✅ WEBHOOK FUNCTIONS (🔥 ADD THIS)
===================================================== */
async function getWebhooks() {
  const res = await fetch("/api/zeaatlas/webhooks");
  const json = await res.json();
  return json.data;
}

async function toggleWebhook({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const res = await fetch(`/api/zeaatlas/webhooks/${id}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }), // 🔥 IMPORTANT
  });

  const json = await res.json();
  return json.data;
}

async function deleteWebhook(id: string) {
  await fetch(`/api/zeaatlas/webhooks/${id}`, {
    method: "DELETE",
  });
}

/* =====================================================
   ✅ API KEY HOOKS (NO CHANGE)
===================================================== */
export function useApiKeysQuery() {
  return useQuery({
    queryKey: API_KEY_QUERY_KEY,
    queryFn: getApiKeys,
  });
}

export function useCreateApiKeyMutation() {
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: API_KEY_QUERY_KEY });
    },
  });
}

export function useDeleteApiKeyMutation() {
  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: API_KEY_QUERY_KEY });
    },
  });
}

export function useValidateApiKeyMutation() {
  return useMutation({
    mutationFn: validateApiKey,
  });
}

/* =====================================================
   ✅ WEBHOOK HOOKS (🔥 ADD THIS)
===================================================== */
export function useWebhooksQuery() {
  return useQuery({
    queryKey: WEBHOOK_QUERY_KEY,
    queryFn: getWebhooks,
  });
}

export function useToggleWebhookMutation() {
  return useMutation({
    mutationFn: toggleWebhook,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOK_QUERY_KEY,
      });
    },
  });
}

export function useDeleteWebhookMutation() {
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WEBHOOK_QUERY_KEY,
      });
    },
  });
}