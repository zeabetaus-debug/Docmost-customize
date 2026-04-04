import { Module } from '@nestjs/common';
import { AutomationWebhooksService } from './automation-webhooks.service';
import { AutomationWebhooksController } from './automation-webhooks.controller';

@Module({
  controllers: [AutomationWebhooksController],
  providers: [AutomationWebhooksService],
  exports: [AutomationWebhooksService],
})
export class AutomationWebhooksModule {}