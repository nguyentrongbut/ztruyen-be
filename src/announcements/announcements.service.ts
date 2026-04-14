// ** NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Mongoose
import { Model } from 'mongoose';

// ** Schemas
import {
  Announcement,
  AnnouncementDocument,
} from './schemas/announcement.schema';

// ** DTOs
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

// ** Api Query Params
import aqp from 'api-query-params';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
  ) {}

  async getActive(): Promise<Announcement | null> {
    return this.announcementModel
      .findOne({ isActive: true })
      .sort({ updatedAt: -1 })
      .lean();
  }

  async create(dto: CreateAnnouncementDto) {
    return this.announcementModel.create(dto);
  }

  async findAll(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    const keyword = filter.search;

    if (keyword) {
      filter.title = { $regex: keyword.trim(), $options: 'i' };
      delete filter.search;
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 10);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.announcementModel.countDocuments(filter),
      this.announcementModel
        .find(filter)
        .sort((sort as any) ?? { createdAt: -1 })
        .skip(offset)
        .limit(safeLimit)
        .lean(),
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

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(id).lean();
    if (!announcement) throw new NotFoundException('Thông báo không tồn tại');
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.announcementModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );
    if (!announcement) throw new NotFoundException('Thông báo không tồn tại');
    return announcement;
  }

  async remove(id: string) {
    const announcement = await this.announcementModel.findByIdAndDelete(id);
    if (!announcement) throw new NotFoundException('Thông báo không tồn tại');
    return { deleted: true };
  }

  async removeMany(ids: string[]): Promise<{ deleted: number }> {
    const result = await this.announcementModel.deleteMany({
      _id: { $in: ids },
    });
    return { deleted: result.deletedCount };
  }

  async toggleActive(id: string) {
    const announcement = await this.announcementModel.findById(id);
    if (!announcement) throw new NotFoundException('Thông báo không tồn tại');

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    return announcement;
  }
}
