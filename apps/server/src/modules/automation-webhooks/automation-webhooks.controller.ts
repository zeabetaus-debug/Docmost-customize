import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { AutomationWebhooksService } from './automation-webhooks.service';

@Controller('zeaatlas/webhooks')
export class AutomationWebhooksController {
  private readonly logger = new Logger(AutomationWebhooksController.name);

  constructor(private readonly service: AutomationWebhooksService) {}

  // ✅ GET ALL WEBHOOKS
  @Get()
  async findAll() {
    this.logger.log('📥 GET /zeaatlas/webhooks');

    const data = await this.service.getWebhooks();

    return {
      success: true,
      data,
    };
  }

  // ✅ CREATE WEBHOOK
  @Post()
  async create(@Body() body: any) {
    this.logger.log('📤 CREATE WEBHOOK');
    this.logger.debug(body);

    const data = await this.service.createWebhook(body);

    return {
      success: true,
      data,
    };
  }

  // ✅ UPDATE WEBHOOK (🔥 FIX ADDED)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.logger.log(`✏️ UPDATE WEBHOOK: ${id}`);
    this.logger.debug(body);

    const data = await this.service.updateWebhook(id, body);

    return {
      success: true,
      data,
    };
  }

  // ✅ DELETE WEBHOOK (🔥 FIX ADDED)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`🗑 DELETE WEBHOOK: ${id}`);

    await this.service.deleteWebhook(id);

    return {
      success: true,
      message: 'Webhook deleted',
    };
  }

  // ✅ TEST FROM UI PANEL
  @Post('incoming')
  async incomingTest(@Body() body: any) {
    this.logger.log('🧪 Incoming webhook test');
    this.logger.debug(body);

    const { event, pageId } = body;

    await this.service.triggerWebhooks(event, {
      pageId,
      title: 'Test Page',
    });

    return {
      success: true,
      message: 'Incoming webhook test sent',
    };
  }

  // ✅ DIRECT TEST ENDPOINT
  @Post('trigger-test')
  async triggerTest() {
    this.logger.log('🚀 Trigger test manually');

    await this.service.triggerWebhooks('page.updated', {
      pageId: '123',
      title: 'Test Page',
    });

    return {
      success: true,
      message: 'Test webhook triggered',
    };
  }
}