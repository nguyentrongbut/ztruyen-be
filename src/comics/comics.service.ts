import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateComicDto } from './dto/create-comic.dto';
import { UpdateComicDto } from './dto/update-comic.dto';
import aqp from 'api-query-params';
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comic, ComicDocument } from './schemas/comic.schemas';
import { BulkDeleteComicDto } from './dto/bulk-delete-comic.dto';
import { BulkCreateComicDto } from './dto/bulk-create-comic.dto';

@Injectable()
export class ComicsService {
  constructor(
    @InjectModel(Comic.name) private comicModel: Model<ComicDocument>,
  ) {}

  /* ================= CREATE ================= */
  async create(dto: CreateComicDto) {
    const name = dto.name.trim();

    const existed = await this.comicModel.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
    });

    if (existed) {
      throw new BadRequestException('Truyện đã tồn tại');
    }

    return this.comicModel.create({
      ...dto,
      name,
      name_unsigned: removeVietnameseTones(name),
    });
  }

  /* ================= USER ================= */
  async findAllComic(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    /* ===== SEARCH ===== */
    const keyword = filter.search;
    if (keyword) {
      filter.name_unsigned = {
        $regex: removeVietnameseTones(keyword).trim().split(/\s+/).join('.*'),
        $options: 'i',
      };
      delete filter.search;
    }

    /* ===== PAGINATION ===== */
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 20);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.comicModel.countDocuments(filter),
      this.comicModel
        .find(filter)
        .sort((sort as any) || { rank: -1 })
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

  /* ================= ADMIN ================= */

  async findAll(page: number, limit: number, qs: string) {
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

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 20);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.comicModel.countDocuments(filter),
      this.comicModel
        .find(filter)
        .sort((sort as any) || { rank: -1 })
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

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const comic = await this.comicModel.findById(id);

    if (!comic) {
      throw new NotFoundException('Không tìm thấy truyện');
    }

    return comic;
  }

  async update(id: string, dto: UpdateComicDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const comic = await this.comicModel.findById(id);

    if (!comic) {
      throw new NotFoundException('Không tìm thấy truyện');
    }

    if (dto.name) {
      const name = dto.name.trim();

      const existed = await this.comicModel.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: new Types.ObjectId(id) },
      });

      if (existed) {
        throw new BadRequestException('Tên truyện đã tồn tại');
      }

      comic.name = name;
      comic.name_unsigned = removeVietnameseTones(name);
    }

    Object.assign(comic, dto);

    await comic.save();

    return comic;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const comic = await this.comicModel.findById(id);

    if (!comic) {
      throw new NotFoundException('Không tìm thấy truyện');
    }

    await this.comicModel.deleteOne({ _id: id });

    return { deleted: true };
  }

  async bulkDelete(dto: BulkDeleteComicDto) {
    const comics = await this.comicModel
      .find({ _id: { $in: dto.ids } })
      .select('_id')
      .lean();

    if (!comics.length) {
      throw new NotFoundException('Không tìm thấy truyện để xóa');
    }

    await this.comicModel.deleteMany({
      _id: { $in: dto.ids },
    });

    return {
      deleted: true,
      count: comics.length,
    };
  }

  async bulkCreate(dto: BulkCreateComicDto) {
    const items = dto.items;

    if (items.length > 1000) {
      throw new BadRequestException('Tối đa 1000 records/lần import');
    }

    const formatted = items.map((item) => ({
      ...item,
      name: item.name.trim(),
      name_unsigned: removeVietnameseTones(item.name),
      status: item.status?.trim().toLowerCase(),
      country: item.country?.trim().toLowerCase(),
      authors: item.authors || [],
      genres: item.genres || [],
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));

    const slugs = formatted.map((i) => i.slug);

    const existed = await this.comicModel.find({
      slug: { $in: slugs },
    });

    const existedSlugs = new Set(existed.map((e) => e.slug));

    const toInsert = formatted.filter((i) => !existedSlugs.has(i.slug));

    if (!toInsert.length) {
      throw new BadRequestException('Tất cả truyện đã tồn tại');
    }

    const result = await this.comicModel.insertMany(toInsert);

    return {
      inserted: result.length,
      skipped: existedSlugs.size,
    };
  }
}
