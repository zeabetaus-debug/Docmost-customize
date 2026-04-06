import {
  Body,
  Controller,
  Get,
  UnauthorizedException,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { ZeaAtlasService } from './zeaatlas.service';

@Controller('zeaatlas')
export class ZeaAtlasController {
  constructor(private readonly service: ZeaAtlasService) {}

  @Get('pages')
  getPages() {
    return this.service.getPages();
  }

  @Post('pages')
async createPage(
  @Body() body: any,
  @Req() req: any,
) {
  const userId =
    req?.user?.id || "019d3dab-b64a-7204-b32e-0bf82589710b";

  const result = await this.service.createPage({
    title: body.title,
    content: body.content,
    spaceId: body.spaceId,
    userId,
  });

  return {
    success: true,
    data: {
      id: result.id,
      title: result.title,
      slugId: result.slugId,
    },
  };
}

  @Put('pages/:id')
async updatePage(
  @Param('id') id: string,
  @Body() body: any,
  @Req() req: any,
) {
  const userId =
    req?.user?.id || "019d3dab-b64a-7204-b32e-0bf82589710b";

  const result = await this.service.updatePage(id, {
    title: body.title,
    content: body.content,
    userId,
  });

  return {
    success: true,
    data: {
      id: result.id,
      title: result.title,
      slugId: result.slugId,
    },
  };
}

  @Get('pages/:id/download')
  async downloadPage(@Param('id') id: string, @Res() res: any) {
    const page = await this.service.getPage(id);

    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', 'attachment; filename="sheet.json"');

    return res.send(JSON.stringify(page.content ?? {}));
  }
}
