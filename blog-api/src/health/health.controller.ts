import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return { service: 'blog-api', status: 'ok' };
  }
}
