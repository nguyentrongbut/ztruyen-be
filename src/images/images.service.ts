// ** NestJs
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

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

@Injectable()
export class ImagesService {
  constructor(
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
    @Inject(forwardRef(() => UploadTelegramService))
    private readonly uploadTelegramService: UploadTelegramService,
  ) {}

  async findImage(slug: string, res: Response) {
    const image = await this.imageModel.findOne({ slug });
    if (!image) throw new NotFoundException(IMAGE_MESSAGES.NOT_FOUND);

    const stream = await this.uploadTelegramService.getFileStream(image.fileId);

    res.setHeader('Content-Type', 'image/webp');

    stream.pipe(res);
  }

  async create(fileId: string, slug: string) {
    const isExist = await this.imageModel.findOne({ slug });
    if (isExist) {
      throw new BadRequestException(IMAGE_MESSAGES.SLUG_EXISTS);
    }

    const newImage = await this.imageModel.create({
      fileId,
      slug,
    });

    return newImage.slug;
  }

  async createMany(fields: { fileId: string; slug: string }[]) {
    if (!fields || fields.length === 0) {
      throw new BadRequestException(IMAGE_MESSAGES.NO_FIELDS_PROVIDED);
    }

    // Filter out invalid entries
    const docsToInsert = fields
      .filter((f) => f.fileId && f.slug)
      .map((f) => ({ fileId: f.fileId, slug: f.slug }));

    // insertMany
    const insertedDocs = await this.imageModel.insertMany(docsToInsert, {
      ordered: false,
    });

    return {
      success: true,
      createdCount: insertedDocs.length,
      images: insertedDocs.map((d) => ({ slug: d.slug })),
    };
  }

  async remove(slug: string) {
    const image = await this.imageModel.findOne({ slug });
    if (!image) {
      throw new NotFoundException(IMAGE_MESSAGES.NOT_FOUND);
    }

    await this.imageModel.deleteOne({ slug });
    return { success: true, slug };
  }

  async removeMany(slugs: string[]) {
    if (!slugs || slugs.length === 0) {
      throw new BadRequestException(IMAGE_MESSAGES.NO_SLUGS_PROVIDED);
    }

    const images = await this.imageModel.find({ slug: { $in: slugs } });
    if (!images || images.length === 0) {
      throw new NotFoundException(IMAGE_MESSAGES.NO_IMAGES_FOUND_FOR_SLUGS);
    }

    const result = await this.imageModel.deleteMany({ slug: { $in: slugs } });

    return {
      success: true,
      deletedCount: result.deletedCount,
      slugs: images.map((img) => img.slug),
    };
  }
}
