import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import {
  IWebhook,
  IIncomingWebhookTestInput,
  IWebhookInput,
} from "@/features/zeaatlas/webhooks/types/webhook.types";
import { notifications } from "@mantine/notifications";
import { queryClient } from "@/main";

const WEBHOOK_QUERY_KEY = ["zeaatlas-webhooks"];
const BASE = "/zeaatlas/webhooks";

/* =====================================================
   🔥 NORMALIZER
===================================================== */
function normalizeWebhook(data: any): IWebhook {
  return {
    ...data,

    active:
      data.is_active === true ||
      data.is_active === 1 ||
      data.is_active === "true",

    apiToken:
      data.api_token ||
      data.apiToken ||
      "",

    createdAt:
      data.created_at ||
      data.createdAt ||
      null,
  };
}

/* =====================================================
   ✅ GET
===================================================== */
async function getWebhooks(): Promise<IWebhook[]> {
  try {
    const res = await api.get(BASE);

    const list = Array.isArray(res.data?.data)
      ? res.data.data
      : [];

    return list.map(normalizeWebhook);
  } catch (error) {
    console.error("❌ GET WEBHOOKS ERROR:", error);
    return [];
  }
}

/* =====================================================
   ✅ CREATE
===================================================== */
async function createWebhook(input: IWebhookInput): Promise<IWebhook> {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const res = await api.post(BASE, {
    ...input,
    createdBy: user?.name || "User",
  });

  return normalizeWebhook(res.data?.data);
}

/* =====================================================
   ✅ UPDATE
===================================================== */
async function updateWebhook(
  input: Partial<IWebhookInput> & { id: string }
): Promise<IWebhook> {
  const { id, ...body } = input;

  const res = await api.patch(`${BASE}/${id}`, body);

  return normalizeWebhook(res.data?.data);
}

/* =====================================================
   ✅ DELETE
===================================================== */
async function deleteWebhook(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

/* =====================================================
   ✅ TEST
===================================================== */
async function testIncomingWebhook(
  input: IIncomingWebhookTestInput
): Promise<unknown> {
  return api.post(`${BASE}/incoming`, input);
}

/* =====================================================
   ✅ QUERY
===================================================== */
export function useWebhooksQuery() {
  return useQuery({
    queryKey: WEBHOOK_QUERY_KEY,
    queryFn: getWebhooks,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });
}

/* =====================================================
   ✅ CREATE MUTATION
===================================================== */
export function useCreateWebhookMutation() {
  return useMutation({
    mutationFn: createWebhook,

    onSuccess: async () => {
      notifications.show({
        message: "Webhook created",
        color: "green",
      });

      await queryClient.invalidateQueries({
        queryKey: WEBHOOK_QUERY_KEY,
      });
    },
  });
}

/* =====================================================
   ✅ UPDATE MUTATION (🔥 FINAL CLEAN)
===================================================== */
export function useUpdateWebhookMutation() {
  return useMutation({
    mutationFn: updateWebhook,

    onMutate: async (updated) => {
      await queryClient.cancelQueries({
        queryKey: WEBHOOK_QUERY_KEY,
      });

      const previous = queryClient.getQueryData<IWebhook[]>(
        WEBHOOK_QUERY_KEY
      );

      queryClient.setQueryData<IWebhook[]>(
        WEBHOOK_QUERY_KEY,
        (old = []) =>
          old.map((item) =>
            item.id === updated.id
              ? { ...item, ...updated }
              : item
          )
      );

      return { previous };
    },

    onError: (_err, _newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          WEBHOOK_QUERY_KEY,
          context.previous
        );
      }

      notifications.show({
        message: "Failed to update webhook",
        color: "red",
      });
    },

    onSuccess: (_data, variables) => {
      notifications.show({
        message: variables.active
          ? "Webhook enabled"
          : "Webhook disabled",
        color: variables.active ? "green" : "gray",
      });
    },
  });
}

/* =====================================================
   ✅ DELETE MUTATION
===================================================== */
export function useDeleteWebhookMutation() {
  return useMutation({
    mutationFn: deleteWebhook,

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({
        queryKey: WEBHOOK_QUERY_KEY,
      });

      const previous = queryClient.getQueryData<IWebhook[]>(
        WEBHOOK_QUERY_KEY
      );

      queryClient.setQueryData<IWebhook[]>(
        WEBHOOK_QUERY_KEY,
        (old = []) => old.filter((item) => item.id !== id)
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          WEBHOOK_QUERY_KEY,
          context.previous
        );
      }
    },

    onSuccess: () => {
      notifications.show({
        message: "Webhook deleted",
        color: "green",
      });
    },
  });
}

/* =====================================================
   ✅ TEST MUTATION
===================================================== */
export function useTestIncomingWebhookMutation() {
  return useMutation({
    mutationFn: testIncomingWebhook,

    onSuccess: () => {
      notifications.show({
        message: "Test sent successfully",
        color: "green",
      });
    },
  });
}