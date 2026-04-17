// notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationType } from '../configs/enums/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Notify reply
  // ─────────────────────────────────────────────────────────────

  async notifyReply(params: {
    recipientId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    commentId: string;
    replyId: string;
    comicName?: string;
    comicSlug?: string;
    chapterId?: string;
    contentPreview?: string;
  }) {
    const {
      recipientId,
      senderId,
      senderName,
      senderAvatar,
      commentId,
      replyId,
      comicName,
      comicSlug,
      chapterId,
      contentPreview,
    } = params;

    if (recipientId === senderId) return;

    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      type: NotificationType.REPLY_COMMENT,
      commentId: new Types.ObjectId(commentId),
      replyId: new Types.ObjectId(replyId),
      meta: {
        senderName,
        senderAvatar,
        comicName,
        comicSlug,
        chapterId,
        contentPreview: contentPreview?.slice(0, 100),
      },
    });

    const recipient = await this.userModel
      .findById(recipientId)
      .select('fcmTokens');

    if (!recipient?.fcmTokens?.length) return;

    const title = `${senderName} đã phản hồi bình luận tại ${
      comicName ?? 'một truyện'
    }`;

    const body = contentPreview?.slice(0, 100) ?? '';

    await this.firebaseService.sendToTokens(recipient.fcmTokens, {
      title,
      body,
      data: {
        type: NotificationType.REPLY_COMMENT,
        senderName,
        senderAvatar: senderAvatar ?? '',
        commentId,
        replyId,
        comicSlug: comicSlug ?? '',
        chapterId: chapterId ?? '',
        comicName: comicName ?? '',
        notificationId: notification._id.toString(),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Notify like
  // ─────────────────────────────────────────────────────────────

  async notifyLike(params: {
    recipientId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    commentId: string;
    comicSlug?: string;
    chapterId?: string;
    contentPreview?: string;
    comicName?: string;
  }) {
    const {
      recipientId,
      senderId,
      senderName,
      senderAvatar,
      commentId,
      comicSlug,
      chapterId,
      contentPreview,
      comicName,
    } = params;

    if (recipientId.toString() === senderId.toString()) return;

    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      type: NotificationType.LIKE_COMMENT,
      commentId: new Types.ObjectId(commentId),
      meta: {
        senderName,
        senderAvatar,
        comicSlug,
        comicName,
        chapterId,
        contentPreview: contentPreview?.slice(0, 100),
      },
    });

    const recipient = await this.userModel
      .findById(recipientId)
      .select('fcmTokens');

    if (!recipient?.fcmTokens?.length) return;

    const title = `${senderName} đã thích bình luận tại ${
      comicName ?? 'một truyện'
    }`;

    const body = contentPreview?.slice(0, 100) ?? '';

    await this.firebaseService.sendToTokens(recipient.fcmTokens, {
      title,
      body,
      data: {
        type: NotificationType.LIKE_COMMENT,
        senderName,
        senderAvatar: senderAvatar ?? '',
        commentId,
        comicSlug: comicSlug ?? '',
        chapterId: chapterId ?? '',
        comicName: comicName ?? '',
        notificationId: notification._id.toString(),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────

  async getMyNotifications(userId: string, page: number, limit: number) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(50, limit || 20);
    const offset = (safePage - 1) * safeLimit;

    const filter = { recipientId: new Types.ObjectId(userId) };

    const [totalItems, result, unreadCount] = await Promise.all([
      this.notificationModel.countDocuments(filter),
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(safeLimit)
        .lean(),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);

    return {
      meta: {
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalItems / safeLimit),
        totalItems,
        unreadCount,
      },
      result,
    };
  }

  async markAsRead(userId: string, notificationId?: string) {
    const filter: Record<string, any> = {
      recipientId: new Types.ObjectId(userId),
    };

    if (notificationId) {
      filter._id = new Types.ObjectId(notificationId);
    }

    await this.notificationModel.updateMany(filter, { isRead: true });
    return { success: true };
  }

  async deleteOne(userId: string, notificationId: string) {
    await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(userId),
    });
    return { deleted: true };
  }

  async deleteAll(userId: string) {
    await this.notificationModel.deleteMany({
      recipientId: new Types.ObjectId(userId),
    });
    return { deleted: true };
  }
}
