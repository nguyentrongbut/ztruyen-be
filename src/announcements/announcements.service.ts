// ** NestJS
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Mongoose
import { Model } from 'mongoose';

// ** Schemas
import {
  Announcement,
  AnnouncementDocument,
  AnnouncementType,
} from './schemas/announcement.schema';

// ** DTOs
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

// ** Services
import { FirebaseService } from '../firebase/firebase.service';

// Topic FCM mà mọi client subscribe khi mở app (không cần login)
const GLOBAL_TOPIC = 'global';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Tính năng 2: Thông báo toàn hệ thống — không cần đăng nhập
  // ─────────────────────────────────────────────────────────────

  /**
   * Client gọi 1 lần khi mở app, không cần đăng nhập.
   * Trả về thông báo active ưu tiên nhất, hoặc null nếu không có.
   */
  async getActive(): Promise<Announcement | null> {
    const now = new Date();

    return this.announcementModel
      .findOne({
        isActive: true,
        $or: [
          // Không có thời gian giới hạn → luôn hiển thị
          { startAt: null, endAt: null },
          // Trong khoảng thời gian hợp lệ
          { startAt: { $lte: now }, endAt: { $gte: now } },
          // Có startAt nhưng không giới hạn endAt
          { startAt: { $lte: now }, endAt: null },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ─────────────────────────────────────────────────────────────
  // Admin CRUD
  // ─────────────────────────────────────────────────────────────

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.announcementModel.create(dto);

    if (announcement.isActive) {
      // FCM cho user đóng tab / PWA
      this.pushToAllUsers(announcement).catch((err) =>
        this.logger.error('Push announcement on create failed', err),
      );
    }

    return announcement;
  }

  async findAll(page: number, limit: number) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 10);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.announcementModel.countDocuments(),
      this.announcementModel
        .find()
        .sort({ createdAt: -1 })
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

  async toggleActive(id: string) {
    const announcement = await this.announcementModel.findById(id);
    if (!announcement) throw new NotFoundException('Thông báo không tồn tại');

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    if (announcement.isActive) {
      // FCM
      this.pushToAllUsers(announcement).catch((err) =>
        this.logger.error('Push announcement on toggle failed', err),
      );
    }

    return announcement;
  }

  // ─────────────────────────────────────────────────────────────
  // Internal: Gửi FCM topic broadcast đến toàn bộ user
  // ─────────────────────────────────────────────────────────────

  private async pushToAllUsers(announcement: Announcement) {
    const typeLabel: Record<AnnouncementType, string> = {
      [AnnouncementType.INFO]: '📢 Thông báo',
      [AnnouncementType.WARNING]: '⚠️ Cảnh báo',
      [AnnouncementType.MAINTENANCE]: '🔧 Bảo trì hệ thống',
      [AnnouncementType.EVENT]: '🎉 Sự kiện',
    };

    await this.firebaseService.sendToTopic(GLOBAL_TOPIC, {
      title: typeLabel[announcement.type] ?? '📢 Thông báo',
      body: announcement.title,
      data: {
        type: 'ANNOUNCEMENT',
        announcementType: announcement.type,
        title: announcement.title,
        content: announcement.content,
      },
    });
  }
}