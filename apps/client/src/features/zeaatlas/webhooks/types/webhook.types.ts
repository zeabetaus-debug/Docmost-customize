export const WEBHOOK_EVENTS = [
  "page.created",
  "page.updated",
  "page.approved",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface IWebhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
  createdAt: string;
  lastTriggeredAt?: string | null;
  status?: "success" | "failed" | "inactive";
}

export interface IWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  secret?: string;
}

export interface IIncomingWebhookTestInput {
  token: string;
  payload: unknown;
}
