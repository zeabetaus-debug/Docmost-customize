import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
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

const API_KEY_QUERY_KEY = ["zeaatlas-api-keys"];

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
