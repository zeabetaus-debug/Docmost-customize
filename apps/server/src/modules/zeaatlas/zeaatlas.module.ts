import { Module } from '@nestjs/common';
import { ZeaAtlasController } from './zeaatlas.controller';
import { ZeaAtlasService } from './zeaatlas.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ZeaAtlasController], 
  providers: [ZeaAtlasService],
})
export class ZeaAtlasModule {}