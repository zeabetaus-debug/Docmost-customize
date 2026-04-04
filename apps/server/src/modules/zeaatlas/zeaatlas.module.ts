import { Module } from '@nestjs/common';
import { ZeaAtlasController } from './zeaatlas.controller';
import { ZeaAtlasService } from './zeaatlas.service';

@Module({
  controllers: [ZeaAtlasController], // ✅ MUST BE HERE
  providers: [ZeaAtlasService],
})
export class ZeaAtlasModule {}