import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health/live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('health/ready')
  ready(): { status: string } {
    return { status: 'ok' };
  }
}
