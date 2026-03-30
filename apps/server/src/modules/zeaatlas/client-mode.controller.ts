import { Controller, Get, Patch, Query, Body } from '@nestjs/common';
import { ClientModeService } from './client-mode.service';

@Controller('client-mode')
export class ClientModeController {
  constructor(private readonly service: ClientModeService) {}

  @Get()
  async get(@Query('userId') userId: string) {
    if (!userId) {
      return {
        success: false,
        status: 400,
        message: 'userId is required',
      };
    }

    const data = await this.service.get(userId);

    return {
      success: true,
      status: 200,
      data,
    };
  }

  @Patch()
  async update(
    @Query('userId') userId: string,
    @Body('value') value: boolean,
  ) {
    if (!userId) {
      return {
        success: false,
        status: 400,
        message: 'userId is required',
      };
    }

    await this.service.update(userId, value);

    return {
      success: true,
      status: 200,
    };
  }
}