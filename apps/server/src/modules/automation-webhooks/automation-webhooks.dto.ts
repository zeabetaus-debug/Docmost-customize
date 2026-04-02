export class CreateWebhookDto {
  name: string;
  url: string;
  events: string[] | string;
  apiToken?: string;
  active?: boolean;

  // ✅ ADD THIS
  createdBy?: string;
}