// ** NestJs
import { Controller, Get } from '@nestjs/common';

// ** Swagger
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('system')

@Controller()
export class AppController {
  @Get('re-call')
  @ApiOperation({
    summary: 'Keep server alive / warm-up',
    description: 'Endpoint dùng để gọi định kỳ nhằm giữ server hoạt động, tránh sleep (render, railway, etc.)',
  })
  reCall() {
    return 'Hello World!';
  }
}
