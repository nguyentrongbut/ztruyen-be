// ** NestJs
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Req,
  Res,
} from '@nestjs/common';

// ** Express
import type { Request, Response } from 'express';

// ** Services
import { ImagesService } from './images.service';

// ** Decorator
import { ResponseMessage } from '../decorator/customize';

// ** Message
import { IMAGE_MESSAGES } from '../configs/messages/image.message';

// ** Swagger
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('image')
@Controller('image')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

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
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'];

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
