// ** NestJs
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// ** Express
import { Response } from 'express';

// ** Mongoose
import { Model } from 'mongoose';

// ** Services
import { UploadTelegramService } from '../upload-telegram/upload-telegram.service';

// ** Schemas
import { Image, ImageDocument } from './schemas/image.schema';

// ** Messages
import { IMAGE_MESSAGES } from '../configs/messages/image.message';
import { validateMongoId, validateMongoIds } from '../utils/mongoose.util';

@Injectable()
export class ImagesService {
  constructor(
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
    @Inject(forwardRef(() => UploadTelegramService))
    private readonly uploadTelegramService: UploadTelegramService,
    private readonly configService: ConfigService,
  ) {}

  async findImage(slug: string, res: Response) {
    const image = await this.imageModel.findOne({ slug });
    if (!image) throw new NotFoundException(IMAGE_MESSAGES.NOT_FOUND);

    const stream = await this.uploadTelegramService.getFileStream(image.fileId);

    res.setHeader('Content-Type', 'image/webp');

    stream.pipe(res);
  }

  async create(fileId: string, slug: string, url?: string) {
    const isExist = await this.imageModel.findOne({ slug });
    if (isExist) {
      throw new BadRequestException(IMAGE_MESSAGES.SLUG_EXISTS);
    }

    const finalUrl =
      url ??
      `${this.configService.get<string>('BACKEND_URL')}/images/${slug}`;

    const newImage = await this.imageModel.create({
      fileId,
      slug,
      url: finalUrl,
    });

    return {
      _id: newImage._id,
      url: newImage.url,
    };
  }

  async createMany(fields: { fileId: string; slug: string }[]) {
    if (!fields || fields.length === 0) {
      throw new BadRequestException(IMAGE_MESSAGES.NO_FIELDS_PROVIDED);
    }

    const backendUrl = this.configService.get<string>('BACKEND_URL');

    // Filter out invalid entries
    const docsToInsert = fields
      .filter((f) => f.fileId && f.slug)
      .map((f) => ({
        fileId: f.fileId,
        slug: f.slug,
        url: `${backendUrl}/images/${f.slug}`,
      }));

    // insertMany
    const insertedDocs = await this.imageModel.insertMany(docsToInsert, {
      ordered: false,
    });

    return {
      success: true,
      createdCount: insertedDocs.length,
      images: insertedDocs.map((d) => ({
        _id: d._id,
        url: d.url,
      })),
    };
  }

  async remove(id: string) {
    validateMongoId(id);

    const image = await this.imageModel.findById(id);
    if (!image) {
      throw new NotFoundException(IMAGE_MESSAGES.NOT_FOUND);
    }

    await this.imageModel.findByIdAndDelete(id);

    return {
      success: true,
      _id: image._id,
      slug: image.slug,
    };
  }


  async removeMany(ids: string[]) {
    validateMongoIds(ids);

    const images = await this.imageModel.find({
      _id: { $in: ids },
    });

    if (!images || images.length === 0) {
      throw new NotFoundException(IMAGE_MESSAGES.NO_IMAGES_FOUND_FOR_IDS);
    }

    const result = await this.imageModel.deleteMany({
      _id: { $in: ids },
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
      ids: images.map((img) => img._id),
    };
  }
}
