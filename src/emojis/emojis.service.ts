import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import aqp from 'api-query-params';

import { Emoji, EmojiDocument } from './schemas/emoji.schema';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';
import { BulkDeleteEmojiDto } from './dto/bulk-delete-emoji.dto';
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import { EmojiType } from '../configs/enums/emoji.enum';
import { EMOJI_MESSAGES } from '../configs/messages/emoji.message';

import { ImagesService } from '../images/images.service';

@Injectable()
export class EmojisService {
  constructor(
    @InjectModel(Emoji.name) private emojiModel: Model<EmojiDocument>,
    private readonly imageService: ImagesService,
  ) {}

  async create(dto: CreateEmojiDto) {
    const name = dto.name.trim();

    const existed = await this.emojiModel.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
    });
    if (existed) throw new BadRequestException(EMOJI_MESSAGES.ALREADY_EXISTS);

    if (dto.type === EmojiType.IMAGE && !dto.image) {
      throw new BadRequestException('Emoji image phải có image');
    }
    if (dto.type === EmojiType.TEXT && !dto.text) {
      throw new BadRequestException('Emoji text phải có text');
    }

    return this.emojiModel.create({
      ...dto,
      name,
      category: dto.category ? new Types.ObjectId(dto.category) : undefined,
      image: dto.image ? new Types.ObjectId(dto.image) : undefined,
      name_unsigned: removeVietnameseTones(dto.name),
    });
  }

  async getAll(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    const keyword = filter.search;
    if (keyword) {
      filter.name_unsigned = {
        $regex: removeVietnameseTones(keyword).trim().split(/\s+/).join('.*'),
        $options: 'i',
      };
      delete filter.search;
    }

    if (filter.category) {
      filter.category = new Types.ObjectId(filter.category);
    }

    const finalFilter = { ...filter, isActive: true };

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 20);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.emojiModel.countDocuments(finalFilter),
      this.emojiModel
        .find(finalFilter)
        .populate('image', 'url')
        .populate('category', 'name')
        .select('name type image text category isGif')
        .sort((sort as any) || { createdAt: 1 })
        .skip(offset)
        .limit(safeLimit),
    ]);

    return {
      meta: {
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalItems / safeLimit),
        totalItems,
      },
      result,
    };
  }

  async adminGetAll(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);
    delete filter.page;
    delete filter.limit;

    const keyword = filter.search;
    if (keyword) {
      filter.name_unsigned = {
        $regex: removeVietnameseTones(keyword).trim().split(/\s+/).join('.*'),
        $options: 'i',
      };
      delete filter.search;
    }

    if (filter.category) {
      const raw = filter.category;
      let ids: Types.ObjectId[] = [];

      if (Array.isArray(raw)) {
        ids = raw
          .filter((id: string) => Types.ObjectId.isValid(id))
          .map((id: string) => new Types.ObjectId(String(id)));
      } else if (raw && typeof raw === 'object' && raw.$in) {
        ids = (raw.$in as string[])
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(String(id)));
      } else if (typeof raw === 'string' && Types.ObjectId.isValid(raw)) {
        ids = [new Types.ObjectId(raw)];
      }

      filter.category = ids.length === 1 ? ids[0] : { $in: ids };
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 20);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.emojiModel.countDocuments(filter),
      this.emojiModel
        .find(filter)
        .populate('image', 'url')
        .populate('category', 'name')
        .sort((sort as any) || { createdAt: -1 })
        .skip(offset)
        .limit(safeLimit),
    ]);

    return {
      meta: {
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalItems / safeLimit),
        totalItems,
      },
      result,
    };
  }

  async adminGetOne(id: string) {
    const category = await this.emojiModel
      .findById(id)
      .populate('image', 'url');
    if (!category) throw new NotFoundException(EMOJI_MESSAGES.NOT_FOUND);
    return category;
  }

  async update(id: string, dto: UpdateEmojiDto) {
    const emoji = await this.emojiModel.findById(id);
    if (!emoji) throw new NotFoundException(EMOJI_MESSAGES.NOT_FOUND);

    let oldImageId: string | null = null;

    if (dto.name) {
      const name = dto.name.trim();

      const existed = await this.emojiModel.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (existed) throw new BadRequestException(EMOJI_MESSAGES.ALREADY_EXISTS);

      emoji.name = name;
      emoji.name_unsigned = removeVietnameseTones(name);

      if (emoji.image) {
        const image = await this.imageService.findById(emoji.image.toString());
        if (image) {
          const isGif = dto.isGif !== undefined ? dto.isGif : emoji.isGif;

          // delete all -gif and space in slug
          const cleanSlug = image.slug
            .replace(/-gif/g, '') // delete -gif
            .replace(/--+/g, '-') // delete --
            .replace(/-$/, ''); // delete - ''

          const timestamp = cleanSlug.match(/-(\d+)$/)?.[1];

          if (timestamp) {
            const baseName = (dto.name ?? emoji.name)
              .replace(/\s*gif\s*/gi, '') // delete "gif" in name
              .trim()
              .replace(/\s+/g, '-')
              .toLowerCase();

            const newSlug = isGif
              ? `emoji-${baseName}-gif-${timestamp}`
              : `emoji-${baseName}-${timestamp}`;

            await this.imageService.updateSlug(image._id.toString(), newSlug);
          }
        }
      }
    }

    if (dto.type) emoji.type = dto.type;

    if (dto.text) emoji.text = dto.text;

    if (dto.category) {
      emoji.category = new Types.ObjectId(dto.category);
    }

    if (dto.isGif !== undefined) emoji.isGif = dto.isGif;

    if (dto.image && dto.image !== emoji.image?.toString()) {
      oldImageId = emoji.image?.toString() || null;
      emoji.image = new Types.ObjectId(dto.image);
    }

    await emoji.save();

    if (oldImageId) {
      await this.imageService.remove(oldImageId);
    }

    return emoji.populate('image', 'url');
  }

  async toggle(id: string) {
    const emoji = await this.emojiModel.findById(id);
    if (!emoji) throw new NotFoundException(EMOJI_MESSAGES.NOT_FOUND);

    emoji.isActive = !emoji.isActive;
    return emoji.save();
  }

  async delete(id: string) {
    const emoji = await this.emojiModel.findById(id);
    if (!emoji) throw new NotFoundException(EMOJI_MESSAGES.NOT_FOUND);

    await this.emojiModel.deleteOne({ _id: id });

    if (emoji.image) {
      await this.imageService.remove(emoji.image.toString());
    }

    return { deleted: true };
  }

  async bulkDelete(dto: BulkDeleteEmojiDto) {
    const emojis = await this.emojiModel
      .find({ _id: { $in: dto.ids } })
      .select('image')
      .lean();

    await this.emojiModel.deleteMany({ _id: { $in: dto.ids } });

    const imageIds = emojis
      .filter((e) => e.image)
      .map((e) => e.image!.toString());

    if (imageIds.length) {
      await this.imageService.removeMany(imageIds);
    }

    return { deleted: true, count: emojis.length };
  }
}
