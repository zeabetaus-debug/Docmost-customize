import { Module } from '@nestjs/common';
import { AutomationWebhooksController } from './automation-webhooks.controller';
import { AutomationWebhooksService } from './automation-webhooks.service';

@Module({
  controllers: [AutomationWebhooksController],
  providers: [AutomationWebhooksService],

  // 🔥 THIS IS THE KEY FIX
  exports: [AutomationWebhooksService],
})
export class AutomationWebhooksModule {}