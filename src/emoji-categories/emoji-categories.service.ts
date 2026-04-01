import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  EmojiCategory,
  EmojiCategoryDocument,
} from './schemas/emoji-category.schema';
import { CreateEmojiCategoryDto } from './dto/create-emoji-category.dto';
import { UpdateEmojiCategoryDto } from './dto/update-emoji-category.dto';
import { ReorderEmojiCategoryDto } from './dto/reorder-emoji-category.dto';
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import aqp from 'api-query-params';
import { EMOJI_CATEGORY_MESSAGES } from '../configs/messages/emoji-category.message';
import { ImagesService } from '../images/images.service';

@Injectable()
export class EmojiCategoriesService {
  constructor(
    @InjectModel(EmojiCategory.name)
    private categoryModel: Model<EmojiCategoryDocument>,
    private readonly imageService: ImagesService,
  ) {}

  async create(dto: CreateEmojiCategoryDto) {
    const name = dto.name.trim();

    const existed = await this.categoryModel.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
    });
    if (existed) throw new BadRequestException(EMOJI_CATEGORY_MESSAGES.ALREADY_EXISTS);

    const maxOrder = await this.categoryModel
      .findOne()
      .sort({ order: -1 })
      .select('order');

    return this.categoryModel.create({
      ...dto,
      name,
      image: dto.image ? new Types.ObjectId(dto.image) : undefined,
      name_unsigned: removeVietnameseTones(dto.name),
      order: dto.order ?? (maxOrder ? maxOrder.order + 1 : 0),
    });
  }

  async getAll(qs: string) {
    const { filter, sort } = aqp(qs);

    const keyword = filter.search;
    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);
      const regex = unsigned.trim().split(/\s+/).join('.*');
      filter.name_unsigned = { $regex: regex, $options: 'i' };
      delete filter.search;
    }

    const finalFilter = { ...filter, isActive: true };

    const result = await this.categoryModel
      .find(finalFilter)
      .populate('image', 'url')
      .select('name image order')
      .sort((sort as any) || { order: 1 });

    return result;
  }

  async adminGetAll(qs: string) {
    const { filter, sort } = aqp(qs);

    const keyword = filter.search;
    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);
      const regex = unsigned.trim().split(/\s+/).join('.*');
      filter.name_unsigned = { $regex: regex, $options: 'i' };
      delete filter.search;
    }

    const result = await this.categoryModel
      .find(filter)
      .populate('image', 'url')
      .sort((sort as any) || { order: 1 });

    return result;
  }

  async adminGetOne(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('image', 'url');
    if (!category)
      throw new NotFoundException(EMOJI_CATEGORY_MESSAGES.NOT_FOUND);
    return category;
  }

  async update(id: string, dto: UpdateEmojiCategoryDto) {
    const category = await this.categoryModel.findById(id);
    if (!category)
      throw new NotFoundException(EMOJI_CATEGORY_MESSAGES.NOT_FOUND);

    let oldImageId: string | null = null;

    if (dto.name) {
      const name = dto.name.trim();

      const existed = await this.categoryModel.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id },
      });
      if (existed) throw new BadRequestException(EMOJI_CATEGORY_MESSAGES.ALREADY_EXISTS);

      category.name = dto.name;
      category.name_unsigned = removeVietnameseTones(dto.name);
    }
    if (dto.image && dto.image !== category.image?.toString()) {
      oldImageId = category.image?.toString() || null;
      category.image = dto.image as any;
    }
    if (dto.order !== undefined) category.order = dto.order;

    category.save();

    if (oldImageId) {
      await this.imageService.remove(oldImageId);
    }

    return category;
  }

  async toggle(id: string) {
    const category = await this.categoryModel.findById(id);
    if (!category)
      throw new NotFoundException(EMOJI_CATEGORY_MESSAGES.NOT_FOUND);

    category.isActive = !category.isActive;
    return category.save();
  }

  async reorder(dto: ReorderEmojiCategoryDto) {
    const bulkOps = dto.ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await this.categoryModel.bulkWrite(bulkOps);
    return { reordered: true };
  }

  async delete(id: string, emojiModel: Model<any>) {
    const category = await this.categoryModel.findById(id);
    if (!category)
      throw new NotFoundException(EMOJI_CATEGORY_MESSAGES.NOT_FOUND);

    const hasEmoji = await emojiModel.exists({ category: id });
    if (hasEmoji) {
      throw new BadRequestException(EMOJI_CATEGORY_MESSAGES.HAS_EMOJI);
    }

    const imageId = category.image?.toString();

    await this.categoryModel.deleteOne({ _id: id });

    if (imageId) {
      await this.imageService.remove(imageId);
    }

    return { deleted: true };
  }
}
