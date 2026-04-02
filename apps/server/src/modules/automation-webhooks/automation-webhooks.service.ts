import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateWebhookDto } from './automation-webhooks.dto';
import { InjectKysely } from 'nestjs-kysely';
import { Kysely } from 'kysely';
import axios from 'axios';

@Injectable()
export class AutomationWebhooksService {
  private readonly logger = new Logger(AutomationWebhooksService.name);

  constructor(
    @InjectKysely() private readonly db: Kysely<any>,
  ) {}

  /* =====================================================
     ✅ CREATE OR UPDATE WEBHOOK (UPSERT)
  ===================================================== */
  async createWebhook(data: CreateWebhookDto) {
  try {
    const events: string[] = Array.isArray(data.events)
      ? data.events
      : data.events
      ? [data.events]
      : [];

    const result = await this.db
      .insertInto('automation_webhooks')
      .values({
        name: data.name?.trim() || 'Untitled',
        url: data.url,
        events: events,
        api_token: data.apiToken ?? '',

        // ✅ STRICT BOOLEAN
        is_active:
          typeof data.active === 'boolean'
            ? data.active
            : true,

        created_by: data.createdBy ?? 'User',
      })
      .returningAll()
      .executeTakeFirst();

    return result;
  } catch (error: any) {
    this.logger.error('❌ CREATE WEBHOOK ERROR', error);
    throw error;
  }
}

  /* =====================================================
     ✅ GET WEBHOOKS (🔥 CRITICAL FIX)
  ===================================================== */
  async getWebhooks() {
    const data = await this.db
      .selectFrom('automation_webhooks')
      .selectAll()
      .execute();

    // ✅ FORCE BOOLEAN (PREVENT TOGGLE RESET)
    return data.map((item) => ({
  ...item,
  is_active:
    item.is_active === true ||
    item.is_active === 1 ||
    item.is_active === 'true',
}));
  }

  /* =====================================================
     ✅ DELETE WEBHOOK
  ===================================================== */
  async deleteWebhook(id: string) {
    return await this.db
      .deleteFrom('automation_webhooks')
      .where('id', '=', id)
      .execute();
  }

  /* =====================================================
     ✅ UPDATE WEBHOOK (🔥 FINAL FIX)
  ===================================================== */
  async updateWebhook(id: string, data: any) {
    try {
      const existing = await this.db
        .selectFrom('automation_webhooks')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) {
        throw new Error('Webhook not found');
      }

      const updateData: any = {};

      // ✅ ONLY UPDATE PROVIDED FIELDS (NO OVERRIDE)
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      if (data.url !== undefined) {
        updateData.url = data.url;
      }

      if (data.events !== undefined) {
        updateData.events = Array.isArray(data.events)
          ? data.events
          : [data.events];
      }

      if (data.apiToken !== undefined) {
        updateData.api_token = data.apiToken;
      }

      // 🔥 MOST IMPORTANT FIX
      if (data.active !== undefined) {
  updateData.is_active = data.active === true;
}

      const result = await this.db
        .updateTable('automation_webhooks')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      this.logger.log(`✏️ Updated webhook: ${id}`);
      return result;
    } catch (error: any) {
      this.logger.error('❌ UPDATE WEBHOOK ERROR', error);
      throw error;
    }
  }

  /* =====================================================
     ✅ TRIGGER WEBHOOKS
  ===================================================== */
  async triggerWebhooks(event: string, payload: any) {
    const webhooks = await this.db
      .selectFrom('automation_webhooks')
      .selectAll()
      .where('is_active', '=', true)
      .execute();

    for (const webhook of webhooks) {
      const events = Array.isArray(webhook.events)
        ? webhook.events
        : [];

      if (!events.includes(event)) continue;

      try {
        await axios.post(
          webhook.url,
          {
            event,
            data: payload,
          },
          {
            headers: webhook.api_token
              ? {
                  Authorization: `Bearer ${webhook.api_token}`,
                }
              : {},
            timeout: 5000,
          },
        );

        this.logger.log(`✅ Sent → ${webhook.url}`);
      } catch (err: any) {
        this.logger.error(
          `❌ Failed → ${webhook.url}: ${err?.message || err}`,
        );
      }
    }
  }
}