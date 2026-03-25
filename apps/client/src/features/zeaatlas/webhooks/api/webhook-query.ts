import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import { IWebhook, IIncomingWebhookTestInput, IWebhookInput } from "@/features/zeaatlas/webhooks/types/webhook.types";
import { notifications } from "@mantine/notifications";
import { queryClient } from "@/main";

const WEBHOOK_QUERY_KEY = ["zeaatlas-webhooks"];

async function getWebhooks() {
  return api.get("/zeaatlas/webhooks") as Promise<IWebhook[]>;
}

async function createWebhook(input: IWebhookInput) {
  return api.post("/zeaatlas/webhooks", input) as Promise<IWebhook>;
}

async function updateWebhook(input: Partial<IWebhookInput> & { id: string }) {
  const { id, ...body } = input;
  return api.patch(`/zeaatlas/webhooks/${id}`, body) as Promise<IWebhook>;
}

async function deleteWebhook(id: string) {
  return api.delete(`/zeaatlas/webhooks/${id}`) as Promise<void>;
}

async function testIncomingWebhook(input: IIncomingWebhookTestInput) {
  return api.post("/zeaatlas/webhooks/incoming", input) as Promise<unknown>;
}

export function useWebhooksQuery() {
  return useQuery({
    queryKey: WEBHOOK_QUERY_KEY,
    queryFn: getWebhooks,
  });
}

export function useCreateWebhookMutation() {
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: async () => {
      notifications.show({ message: "Webhook created", color: "green" });
      await queryClient.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Failed to create webhook", error);
      notifications.show({ message: "Failed to create webhook", color: "red" });
    },
  });
}

export function useUpdateWebhookMutation() {
  return useMutation({
    mutationFn: updateWebhook,
    onSuccess: async () => {
      notifications.show({ message: "Webhook updated", color: "green" });
      await queryClient.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Failed to update webhook", error);
      notifications.show({ message: "Failed to update webhook", color: "red" });
    },
  });
}

export function useDeleteWebhookMutation() {
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: async () => {
      notifications.show({ message: "Webhook deleted", color: "green" });
      await queryClient.invalidateQueries({ queryKey: WEBHOOK_QUERY_KEY });
    },
    onError: (error) => {
      console.error("Failed to delete webhook", error);
      notifications.show({ message: "Failed to delete webhook", color: "red" });
    },
  });
}

export function useTestIncomingWebhookMutation() {
  return useMutation({
    mutationFn: testIncomingWebhook,
    onSuccess: () => {
      notifications.show({ message: "Test sent successfully", color: "green" });
    },
    onError: (error) => {
      console.error("Failed to send test webhook", error);
      notifications.show({ message: "Failed to send test request", color: "red" });
    },
  });
}
