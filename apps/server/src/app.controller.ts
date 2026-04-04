import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ✅ Default route
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ✅ Test route
  @Get('test')
  testApi() {
    console.log('🔥 TEST API HIT');

    return {
      status: 'ok',
      message: 'AppController working',
    };
  }

  // ✅ Separate profile test route (NO DUPLICATE)
  @Get('profile-test')
  testProfile() {
    console.log('🔥 PROFILE API HIT FROM APP CONTROLLER');

    return {
      id: '1',
      name: 'Dhanush AV',
      email: 'test@gmail.com',
    };
  }
}