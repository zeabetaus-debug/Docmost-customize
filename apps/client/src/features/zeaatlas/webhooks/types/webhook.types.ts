// ✅ DEFINE EVENTS ARRAY FIRST
export const WEBHOOK_EVENTS = [
  "page.created",
  "page.updated",
  "page.approved",
] as const;

// ✅ DERIVE TYPE FROM ARRAY (BEST PRACTICE)
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];


// ✅ MAIN WEBHOOK MODEL
export interface IWebhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;

  // ✅ match backend naming (IMPORTANT)
  apiToken?: string;

  createdAt: string;
  lastTriggeredAt?: string | null;
  status?: "success" | "failed" | "inactive";
}


// ✅ CREATE / UPDATE INPUT
export interface IWebhookInput {
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;

  // ✅ IMPORTANT: match backend field
  apiToken?: string;
}


// ✅ TEST WEBHOOK INPUT
export interface IIncomingWebhookTestInput {
  token: string;
  payload: unknown;
}