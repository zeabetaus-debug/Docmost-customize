import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Controller('zeaatlas')
export class ZeaAtlasController {

  @UseGuards(JwtAuthGuard) // 🔐 REAL USER
  @Get('me')
  getProfile(@Req() req: any) {
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    };
  }
}