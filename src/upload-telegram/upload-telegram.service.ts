// ** NestJs
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ** Axios
import axios, { AxiosResponse } from 'axios';

// ** Stream
import { Readable } from 'stream';

// ** FormData
import FormData from 'form-data';

// ** Slugify
import slugify from 'slugify';

// ** Sharp
import sharp from 'sharp';

// ** Messages
import { UPLOAD_MESSAGES } from '../configs/messages/upload.message';

// ** Service
import { ImagesService } from '../images/images.service';

@Injectable()
export class UploadTelegramService {
  private readonly token: string;
  private readonly chatId: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ImagesService))
    private readonly imageService: ImagesService,
  ) {
    this.token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') as string;
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') as string;

    if (!this.token || !this.chatId) {
      throw new Error(
        'Missing configuration: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
      );
    }
  }

  private apiUrl(method: string) {
    return `https://api.telegram.org/bot${this.token}/${method}`;
  }

  private async convertToWebP(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    try {
      const metadata = await sharp(fileBuffer).metadata();

      if (metadata.format === 'webp') {
        return { buffer: fileBuffer, filename };
      }

      const webpBuffer = await sharp(fileBuffer)
        .webp({
          quality: 80,
          lossless: false,
          effort: 6,
        })
        .toBuffer();

      const newFilename = filename.replace(/\.[^.]+$/, '.webp');

      return { buffer: webpBuffer, filename: newFilename };
    } catch {
      return { buffer: fileBuffer, filename };
    }
  }

  async getFilePath(fileId: string): Promise<string> {
    try {
      const res = await axios.get(this.apiUrl(`getFile?file_id=${fileId}`));
      if (!res.data.ok) {
        throw new NotFoundException(UPLOAD_MESSAGES.FILE_NOT_FOUND);
      }
      return res.data.result.file_path;
    } catch {
      throw new NotFoundException(UPLOAD_MESSAGES.FETCH_FILE_ERROR);
    }
  }

  async getFileStream(fileId: string): Promise<Readable> {
    const filePath = await this.getFilePath(fileId);
    const url = `https://api.telegram.org/file/bot${this.token}/${filePath}`;

    try {
      const response: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      return response.data;
    } catch {
      throw new NotFoundException(UPLOAD_MESSAGES.STREAM_FILE_ERROR);
    }
  }

  async sendDocumentByBuffer(
    fileBuffer: Buffer,
    filename: string,
    caption: string,
  ) {
    if (!caption) {
      throw new BadRequestException(UPLOAD_MESSAGES.CAPTION_REQUIRED);
    }

    try {
      const { buffer: convertedBuffer, filename: convertedFilename } =
        await this.convertToWebP(fileBuffer, filename);

      const form = new FormData();
      form.append('chat_id', this.chatId);
      form.append('document', convertedBuffer, { filename: convertedFilename });
      form.append('caption', caption);

      const res = await axios.post(this.apiUrl('sendDocument'), form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        params: { disable_content_type_detection: true },
      });

      if (!res.data.ok) {
        throw new BadRequestException(
          res.data.description || UPLOAD_MESSAGES.UPLOAD_FAILED,
        );
      }

      const result = res.data.result;
      let fileId;

      if (result.document) {
        fileId = result.document.file_id;
      } else if (result.sticker) {
        fileId = result.sticker.file_id;
      } else if (result.photo) {
        const photos = result.photo;
        fileId = photos[photos.length - 1].file_id;
      } else {
        throw new BadRequestException(
          'Telegram did not return a file. Response: ' + JSON.stringify(result),
        );
      }

      const slug = slugify(caption, { lower: true, strict: true });

      return await this.imageService.create(fileId, slug);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to upload document: ${
          error.message || UPLOAD_MESSAGES.UPLOAD_FAILED
        }`,
      );
    }
  }

  async sendDocumentsByBuffers(files: Express.Multer.File[], caption: string) {
    if (!caption) {
      throw new BadRequestException(UPLOAD_MESSAGES.CAPTION_REQUIRED);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files to upload');
    }

    if (files.length > 10) {
      throw new BadRequestException(
        'Telegram allows a maximum of 10 files per upload',
      );
    }

    try {
      // 1. Convert tất cả file sang webp nếu cần
      const convertedFiles = await Promise.all(
        files.map(async (file) => {
          const { buffer, filename } = await this.convertToWebP(
            file.buffer,
            file.originalname,
          );
          return { buffer, filename, originalname: file.originalname };
        }),
      );

      // 2. Upload từng file lên Telegram và thu về fileId
      const uploadResults = await Promise.all(
        convertedFiles.map(async (file, index) => {
          const fileCaption =
            index === 0 ? caption : `${caption} (${index + 1})`;

          const form = new FormData();
          form.append('chat_id', this.chatId);
          form.append('document', file.buffer, { filename: file.filename });
          form.append('caption', fileCaption);

          const res = await axios.post(this.apiUrl('sendDocument'), form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            params: { disable_content_type_detection: true },
          });

          if (!res.data.ok) {
            throw new Error(res.data.description || 'Upload failed');
          }

          const result = res.data.result;
          let fileId;

          if (result.document) fileId = result.document.file_id;
          else if (result.photo) {
            const photos = result.photo;
            fileId = photos[photos.length - 1].file_id;
          } else {
            throw new BadRequestException(
              'Telegram did not return a fileId for ' + file.filename,
            );
          }

          // Tạo slug riêng cho mỗi ảnh
          const slug = slugify(`${caption}-${index + 1}`, {
            lower: true,
            strict: true,
          });

          return { fileId, slug };
        }),
      );

      // Lưu tất cả vào MongoDB cùng lúc
      return await this.imageService.createMany(uploadResults);
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to upload multiple documents: ${
          error.message || UPLOAD_MESSAGES.UPLOAD_FAILED
        }`,
      );
    }
  }
}
