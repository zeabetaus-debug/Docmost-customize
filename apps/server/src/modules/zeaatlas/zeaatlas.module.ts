import { Module } from '@nestjs/common';
import { ZeaAtlasController } from './zeaatlas.controller';
import { ZeaAtlasService } from './zeaatlas.service';
import { DatabaseModule } from '../../database/database.module';
import { PageModule } from '../../core/page/page.module';

@Module({
  imports: [DatabaseModule, PageModule],
  controllers: [ZeaAtlasController], 
  providers: [ZeaAtlasService],
})
export class ZeaAtlasModule {}
