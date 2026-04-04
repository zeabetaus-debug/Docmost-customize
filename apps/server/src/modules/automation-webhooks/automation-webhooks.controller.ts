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

@Controller('zeaatlas/webhooks') // ✅ FINAL FIX
export class AutomationWebhooksController {
  private readonly logger = new Logger(AutomationWebhooksController.name);

  constructor(private readonly service: AutomationWebhooksService) {}

  @Get()
  async findAll() {
    const data = await this.service.getWebhooks();
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.service.createWebhook(body);
    return { success: true, data };
  }

@Patch(':id/toggle')
async toggle(
  @Param('id') id: string,
  @Body('active') active: boolean,
) {
  return this.service.toggleWebhook(id, active);
}


  @Post('incoming')
  async incomingTest(@Body() body: any) {
    const { event, pageId } = body;

    await this.service.triggerWebhooks(event, {
      pageId,
      title: 'Test Page',
    });

    return { success: true };
  }
@Delete(':id')
async deleteWebhook(@Param('id') id: string) {
  await this.service.deleteWebhook(id);

  return {
    success: true,
  };
}
  @Post('trigger-test')
  async triggerTest() {
    await this.service.triggerWebhooks('page.updated', {
      pageId: '123',
      title: 'Test Page',
    });

    return { success: true };
  }
}