// ** NestJs
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('re-call')
  reCall() {
    return 'Hello World!';
  }
}
