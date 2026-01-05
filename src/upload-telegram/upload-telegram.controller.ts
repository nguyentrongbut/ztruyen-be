// ** NestJs
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

// ** Services
import { UploadTelegramService } from './upload-telegram.service';

// ** Multer
import { memoryStorage } from 'multer';

// ** Decorators
import { ResponseMessage } from '../decorator/customize';

// ** Messages
import { UPLOAD_MESSAGES } from '../configs/messages/upload.message';

// ** Swagger
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('upload')
@ApiBearerAuth('access-token')
@Controller('upload')
export class UploadTelegramController {
  constructor(private readonly uploadTelegramService: UploadTelegramService) {}

  private fileFilter = (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Chỉ chấp nhận file: ${allowedMimes.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  };

  @Post()
  @ResponseMessage(UPLOAD_MESSAGES.UPLOAD_SINGLE_SUCCESS)
  @ApiOperation({
    summary: 'Upload 1 ảnh',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        caption: {
          type: 'string',
          example: 'Ảnh bìa',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException(UPLOAD_MESSAGES.ONLY_IMAGES_ALLOWED),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption: string,
  ) {
    if (!file) {
      throw new BadRequestException(UPLOAD_MESSAGES.NO_FILE_UPLOADED);
    }
    return this.uploadTelegramService.sendDocumentByBuffer(
      file.buffer,
      file.originalname,
      caption,
    );
  }

  @Post('upload-multiple')
  @ResponseMessage(UPLOAD_MESSAGES.UPLOAD_MULTIPLE_SUCCESS)
  @ApiOperation({
    summary: 'Upload nhiều ảnh',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        caption: {
          type: 'string',
          example: 'Ảnh',
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException(UPLOAD_MESSAGES.ONLY_IMAGES_ALLOWED),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadManyDocuments(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('caption') caption: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(UPLOAD_MESSAGES.NO_FILES_UPLOADED);
    }
    return this.uploadTelegramService.sendDocumentsByBuffers(files, caption);
  }
}
