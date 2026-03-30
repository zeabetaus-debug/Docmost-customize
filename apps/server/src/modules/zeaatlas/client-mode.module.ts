import { Module } from '@nestjs/common';
import { ClientModeController } from './client-mode.controller';
import { ClientModeService } from './client-mode.service';

@Module({
  controllers: [ClientModeController],
  providers: [ClientModeService],
})
export class ClientModeModule {}