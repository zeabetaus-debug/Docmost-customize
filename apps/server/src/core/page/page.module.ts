import { Module } from '@nestjs/common';
import { PageService } from './services/page.service';
import { PageController } from './page.controller';

// ✅ ADD THIS (MISSING SERVICE)
import { PageHistoryService } from './services/page-history.service';

// ✅ YOUR MODULES
import { AutomationWebhooksModule } from '../../modules/automation-webhooks/automation-webhooks.module';
import { CollaborationModule } from '../../collaboration/collaboration.module';

// ✅ CORE MODULES
import { StorageModule } from '../../integrations/storage/storage.module';
import { WatcherModule } from '../watcher/watcher.module';

@Module({
  controllers: [PageController],

  providers: [
    PageService,
    PageHistoryService,
  ],

  imports: [
    AutomationWebhooksModule,
    CollaborationModule,
    StorageModule,
    WatcherModule,
  ],

  exports: [
    PageService,
    PageHistoryService,
  ],
})
export class PageModule {}