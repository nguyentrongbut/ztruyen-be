// ** NestJs
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Express
import type { Request, Response } from 'express';

// ** Services
import { ImagesService } from './images.service';

// ** Decorator
import { Public, ResponseMessage } from '../decorator/customize';

// ** Message
import { IMAGE_MESSAGES } from '../configs/messages/image.message';

// ** Swagger
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('image')
@Controller('image')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/:type/:slug')
  @ResponseMessage(IMAGE_MESSAGES.FETCH_SUCCESS)
  @ApiOperation({
    summary: 'Lấy đường dẫn hình ảnh theo slug',
  })
  findImage(
    @Param('slug') slug: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const referer = req.get('referer');

    const feClientUrl =  this.configService.get<string>('FE_CLIENT_URL')
    const feAdminUrl =  this.configService.get<string>('FE_ADMIN_URL')
    const beUrl = this.configService.get<string>('BACKEND_URL')

    const allowedOrigins = [
      feClientUrl, feAdminUrl, beUrl
    ];

    // Check referer
    if (
      !referer ||
      !allowedOrigins.some((origin) => referer.startsWith(origin))
    ) {
      throw new ForbiddenException(IMAGE_MESSAGES.ACCESS_FORBIDDEN);
    }

    return this.imagesService.findImage(slug, res);
  }
}
