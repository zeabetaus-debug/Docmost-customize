import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZeaAtlasService } from './zeaatlas.service';

@Controller('zeaatlas')
export class ZeaAtlasController {
  constructor(private readonly service: ZeaAtlasService) {}

  @Get('pages')
  getPages() {
    return this.service.getPages();
  }

  @Post('pages')
  createPage(@Body() body: { title: string }) {
    return this.service.createPage(body);
  }
}