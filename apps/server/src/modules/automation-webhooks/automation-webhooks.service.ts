import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWebhookDto } from './automation-webhooks.dto';
import { InjectKysely } from 'nestjs-kysely';
import { Kysely } from 'kysely';
import axios from 'axios';
import { randomBytes } from 'crypto';

@Injectable()
export class AutomationWebhooksService {
  private readonly logger = new Logger(AutomationWebhooksService.name);

  constructor(
    @InjectKysely() private readonly db: Kysely<any>,
  ) {}

  /* =====================================================
     ✅ CREATE WEBHOOK (FIXED TOKEN + EVENTS + TIMESTAMP)
  ===================================================== */
  async createWebhook(data: CreateWebhookDto) {
    try {
      const events: string[] = Array.isArray(data.events)
        ? data.events
        : data.events
        ? [data.events]
        : [];

      // ✅ GENERATE TOKEN IF NOT PROVIDED
      const token =
        data.apiToken || randomBytes(32).toString('hex');

      const result = await this.db
        .insertInto('automation_webhooks')
        .values({
          name: data.name?.trim() || 'Untitled',
          url: data.url,
          events: events,
          api_token: token,
          is_active:
            typeof data.active === 'boolean'
              ? data.active
              : true,
          created_by: data.createdBy ?? 'User',
          created_at: new Date(),
          updated_at: new Date(), // ✅ IMPORTANT
        })
        .returningAll()
        .executeTakeFirst();

      return this.formatWebhook(result);
    } catch (error: any) {
      this.logger.error('❌ CREATE WEBHOOK ERROR', error);
      throw error;
    }
  }

  /* =====================================================
     ✅ GET WEBHOOKS (FIXED EVENTS PARSE)
  ===================================================== */
  async getWebhooks() {
    const data = await this.db
      .selectFrom('automation_webhooks')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return data.map((item) => this.formatWebhook(item));
  }

  /* =====================================================
     ✅ TOGGLE WEBHOOK (FIXED PERSIST + TIMESTAMP)
  ===================================================== */
 async toggleWebhook(id: string, isActive: boolean) {
  try {
    const existing = await this.db
      .selectFrom('automation_webhooks')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    const updated = await this.db
      .updateTable('automation_webhooks')
      .set({
        is_active: isActive,          // ✅ UI value
        updated_at: new Date(),       // ✅ persist change
      })
      .where('id', '=', id)
      .returningAll()                 // ✅ return updated row
      .executeTakeFirst();

    return this.formatWebhook(updated);
  } catch (error: any) {
    this.logger.error('❌ TOGGLE WEBHOOK ERROR', error);
    throw error;
  }
}

  /* =====================================================
     ✅ DELETE WEBHOOK
  ===================================================== */
  async deleteWebhook(id: string) {
    const result = await this.db
      .deleteFrom('automation_webhooks')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException('Webhook not found');
    }

    return { success: true };
  }

  /* =====================================================
     ✅ UPDATE WEBHOOK (FIXED EVENTS + TOKEN + TIMESTAMP)
  ===================================================== */
  async updateWebhook(id: string, data: any) {
    try {
      const existing = await this.db
        .selectFrom('automation_webhooks')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!existing) {
        throw new NotFoundException('Webhook not found');
      }

      const updateData: any = {};

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

      if (data.active !== undefined) {
        updateData.is_active = Boolean(data.active);
      }

      updateData.updated_at = new Date(); // ✅ IMPORTANT

      const result = await this.db
        .updateTable('automation_webhooks')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      return this.formatWebhook(result);
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

  /* =====================================================
     ✅ FORMAT RESPONSE (FIXED TOKEN + EVENTS + TIMESTAMP)
  ===================================================== */
  private formatWebhook(item: any) {
    return {
      id: item.id,
      name: item.name,
      url: item.url,

      // ✅ ALWAYS ARRAY
      events: Array.isArray(item.events)
        ? item.events
        : [],

      // ✅ FIX TOKEN DISPLAY
      apiToken: item.api_token || null,

      active: Boolean(item.is_active),

      createdAt: item.created_at
        ? new Date(item.created_at).toISOString()
        : null,

      updatedAt: item.updated_at
        ? new Date(item.updated_at).toISOString()
        : null,

      createdBy: item.created_by || 'User',
    };
  }
}