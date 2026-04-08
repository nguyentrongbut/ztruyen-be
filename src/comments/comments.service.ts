// ** NestJS
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';

// ** Mongoose
import { Model, Types, Connection } from 'mongoose';
import aqp from 'api-query-params';

// ** Schemas
import { Comment, CommentDocument } from './schemas/comment.schema';
import {
  CommentLike,
  CommentLikeDocument,
} from './schemas/comment-like.schema';
import {
  CommentReport,
  CommentReportDocument,
} from './schemas/comment-report.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

// ** Utils
import { checkSpam } from '../utils/anti-spam';
import { filterBadWords } from '../utils/filter-words';
import { removeVietnameseTones } from '../utils/removeVietnameseTones';

// ** DTOs
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

// ** Enums
import { ReportStatus } from '../configs/enums/comment.enum';

// ** Services
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(CommentLike.name)
    private likeModel: Model<CommentLikeDocument>,
    @InjectModel(CommentReport.name)
    private reportModel: Model<CommentReportDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectConnection()
    private connection: Connection,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Create comment
  // ─────────────────────────────────────────────────────────────

  async create(dto: CreateCommentDto, userId: string) {
    checkSpam(userId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      if (dto.parent) {
        const parent = await this.commentModel.findById(dto.parent);
        if (!parent) throw new NotFoundException();
      }

      const content = filterBadWords(dto.content);

      const comment = await this.commentModel.create(
        [
          {
            ...dto,
            userId,
            content,
            comicName_unsigned: removeVietnameseTones(dto.comicName),
          },
        ],
        { session },
      );

      if (dto.parent) {
        await this.commentModel.updateOne(
          { _id: dto.parent },
          { $inc: { replyCount: 1 } },
          { session },
        );
      }

      await session.commitTransaction();
      return comment[0];
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Create reply
  // ─────────────────────────────────────────────────────────────

  //

  async createReply(dto: CreateReplyDto, userId: string) {
    const { parent: parentId, content } = dto;

    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('Invalid parentId');
    }

    // 1. tìm comment cha
    const parent = await this.commentModel.findById(parentId);
    if (!parent) {
      throw new NotFoundException('Parent comment not found');
    }

    // 2. tìm root comment
    let root = parent;
    if (parent.parent) {
      root = await this.commentModel.findById(parent.parent);
      if (!root) {
        throw new NotFoundException('Root comment not found');
      }
    }

    const rootOwnerId = root.userId?.toString();
    const parentOwnerId = parent.userId?.toString();

    // 3. tạo reply
    const newReply = await this.commentModel.create({
      userId: new Types.ObjectId(userId),
      content,

      //  LUÔN ép ObjectId
      parent: new Types.ObjectId(parentId),

      // replyTo là userId
      replyTo:
        dto.replyTo && Types.ObjectId.isValid(dto.replyTo)
          ? new Types.ObjectId(dto.replyTo)
          : null,

      comicSlug: parent.comicSlug,
      comicName: parent.comicName,
      comicName_unsigned: parent.comicName_unsigned,
      chapterId: parent.chapterId,
      chapterName: parent.chapterName,
      page: parent.page,
    });

    // 4. tăng replyCount
    await this.commentModel.updateOne(
      { _id: parent._id },
      { $inc: { replyCount: 1 } },
    );

    // 5. xác định người nhận
    let recipientId: string | null = null;

    if (dto.replyTo && Types.ObjectId.isValid(dto.replyTo)) {
      recipientId = dto.replyTo;
    } else {
      recipientId = rootOwnerId;
    }

    // 6. block self notify
    if (!recipientId || recipientId === userId.toString()) {
      return newReply;
    }

    // 7. gửi notification
    await this.sendReplyNotification({
      senderId: userId,
      recipientId,
      parent,
      replyId: newReply._id.toString(),
      commentId: parentId,
      content,
    });

    return newReply;
  }

  // ─────────────────────────────────────────────────────────────
  // Notification helpers
  // ─────────────────────────────────────────────────────────────

  private async sendReplyNotification(params: {
    senderId: string;
    recipientId: string;
    parent: any;
    replyId: string;
    commentId: string;
    content: string;
  }) {
    const { senderId, recipientId, parent, replyId, commentId, content } =
      params;

    // double guard
    if (!recipientId || recipientId === senderId) {
      return;
    }

    // sender info
    const sender = await this.userModel
      .findById(senderId)
      .select('name avatar')
      .populate<{ avatar: { url: string } }>('avatar', 'url')
      .lean();

    if (!sender) {
      return;
    }

    try {
      await this.notificationsService.notifyReply({
        recipientId,
        senderId,
        senderName: sender.name,
        senderAvatar: sender.avatar?.url,
        commentId,
        replyId,
        comicName: parent.comicName,
        comicSlug: parent.comicSlug,
        chapterId: parent.chapterId,
        contentPreview: content,
      });
    } catch (err) {
      this.logger.error('notifyReply failed', err);
    }
  }

  private async sendLikeNotification(commentId: string, senderId: string) {
    const comment = await this.commentModel
      .findById(commentId)
      .select('userId content comicSlug chapterId')
      .lean();

    if (!comment) return;

    const recipientId = comment.userId.toString();
    if (recipientId === senderId) return;

    const sender = await this.userModel
      .findById(senderId)
      .select('name avatar')
      .populate<{ avatar: { url: string } }>('avatar', 'url');

    if (!sender) return;

    await this.notificationsService.notifyLike({
      recipientId,
      senderId,
      senderName: sender.name,
      senderAvatar: sender.avatar?.url,
      commentId,
      comicName: comment.comicName,
      comicSlug: comment.comicSlug,
      chapterId: comment.chapterId?.toString(),
      contentPreview: comment.content,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Get comments
  // ─────────────────────────────────────────────────────────────

  async getComments(page: number, limit: number, qs: string, userId?: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;
    delete filter.parent;
    delete filter.userId;

    const finalFilter = { ...filter, parent: null };

    const allowedFields = [
      'comicSlug',
      'chapterId',
      'page',
      'userId',
      'createdAt',
    ];
    Object.keys(filter).forEach((key) => {
      if (!allowedFields.includes(key) && key !== 'search') delete filter[key];
    });

    const keyword = filter.search;
    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);
      const regex = unsigned.trim().split(/\s+/).join('.*');
      filter.comicName_unsigned = { $regex: regex, $options: 'i' };
      delete filter.search;
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 10));
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, totalComments, result] = await Promise.all([
      this.commentModel.countDocuments(finalFilter),
      this.commentModel.countDocuments(filter),
      this.commentModel
        .find(finalFilter)
        .select(
          '-comicName_unsigned -replyTo -isDeleted -deletedAt -__v -comicName',
        )
        .populate({
          path: 'userId',
          select: 'name avatar avatar_frame',
          populate: [
            { path: 'avatar', select: 'url' },
            {
              path: 'avatar_frame',
              select: 'name image',
              populate: { path: 'image', select: 'url' },
            },
          ],
        })
        .sort((sort as any) || { createdAt: -1 })
        .skip(offset)
        .limit(safeLimit)
        .select('-__v'),
    ]);

    const meta = {
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalItems / safeLimit),
      totalItems,
      totalComments,
    };

    if (userId) {
      const commentObjectIds = result.map((c) => c._id);
      const likes = await this.likeModel.find({
        commentId: { $in: commentObjectIds },
        userId: new Types.ObjectId(userId),
      });
      const likedSet = new Set(likes.map((l) => l.commentId.toString()));
      return {
        meta,
        result: result.map((c) => ({
          ...c.toObject(),
          isLiked: likedSet.has(c._id.toString()),
        })),
      };
    }

    return { meta, result };
  }

  // ─────────────────────────────────────────────────────────────
  // Get replies
  // ─────────────────────────────────────────────────────────────

  async getReplies(
    parentId: string,
    page: number,
    limit: number,
    qs: string,
    userId?: string,
  ) {
    const { sort } = aqp(qs);

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 10));
    const offset = (safePage - 1) * safeLimit;

    const filter = { parent: new Types.ObjectId(parentId) };

    const [totalItems, result] = await Promise.all([
      this.commentModel.countDocuments(filter),
      this.commentModel
        .find(filter)
        .select(
          '-comicName_unsigned -isDeleted -deletedAt -__v -comicName -replyCount -comicSlug -chapterName -chapterId -page',
        )
        .populate({
          path: 'userId',
          select: 'name avatar avatar_frame',
          populate: [
            { path: 'avatar', select: 'url' },
            {
              path: 'avatar_frame',
              select: 'name image',
              populate: { path: 'image', select: 'url' },
            },
          ],
        })
        .populate('replyTo', 'name')
        .sort((sort as any) || { createdAt: 1 })
        .skip(offset)
        .limit(safeLimit),
    ]);

    const meta = {
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalItems / safeLimit),
      totalItems,
    };

    if (userId) {
      const commentObjectIds = result.map((r) => r._id);
      const likes = await this.likeModel
        .find({
          commentId: { $in: commentObjectIds },
          userId: new Types.ObjectId(userId),
        })
        .select('commentId');
      const likedSet = new Set(likes.map((l) => l.commentId.toString()));
      return {
        meta,
        result: result.map((r) => ({
          ...r.toObject(),
          isLiked: likedSet.has(r._id.toString()),
        })),
      };
    }

    return { meta, result };
  }

  // ─────────────────────────────────────────────────────────────
  // Like
  // ─────────────────────────────────────────────────────────────

  async like(commentId: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const commentObjectId = new Types.ObjectId(commentId);
      const userObjectId = new Types.ObjectId(userId);

      const exist = await this.likeModel.findOne({
        commentId: commentObjectId,
        userId: userObjectId,
      });

      if (exist) {
        await this.likeModel.deleteOne({ _id: exist._id }, { session });
        await this.commentModel.updateOne(
          { _id: commentId },
          { $inc: { likeCount: -1 } },
          { session },
        );
        await session.commitTransaction();
        return { liked: false };
      }

      await this.likeModel.create(
        [{ commentId: commentObjectId, userId: userObjectId }],
        { session },
      );
      await this.commentModel.updateOne(
        { _id: commentId },
        { $inc: { likeCount: 1 } },
        { session },
      );

      await session.commitTransaction();

      // ── Gửi notification bất đồng bộ — không block response ──
      this.sendLikeNotification(commentId, userId).catch((err) =>
        this.logger.error('Send like notification failed', err),
      );

      return { liked: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Report
  // ─────────────────────────────────────────────────────────────

  async report(commentId: string, userId: string, reason: string) {
    try {
      await this.reportModel.create({
        commentId: new Types.ObjectId(commentId),
        userId: new Types.ObjectId(userId),
        reason,
      });
    } catch (e) {
      if (e.code === 11000) throw new BadRequestException('Already reported');
      throw e;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────

  async delete(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    const commentObjectId = new Types.ObjectId(id);

    try {
      const comment = await this.commentModel.findById(commentObjectId);
      if (!comment) throw new NotFoundException('Bình luận không tồn tại');
      if (comment.userId.toString() !== userId.toString())
        throw new ForbiddenException('Không có quyền xóa');

      const replies = await this.commentModel
        .find({ parent: commentObjectId })
        .select('_id');
      const replyIds = replies.map((r) => r._id);

      await this.commentModel.deleteOne({ _id: commentObjectId }, { session });
      await this.commentModel.deleteMany(
        { parent: commentObjectId },
        { session },
      );

      if (comment.parent) {
        await this.commentModel.updateOne(
          { _id: comment.parent },
          { $inc: { replyCount: -1 } },
          { session },
        );
      }

      await this.likeModel.deleteMany(
        { commentId: { $in: [commentObjectId, ...replyIds] } },
        { session },
      );

      await session.commitTransaction();
      return { deleted: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────────────────────────

  async adminGetComments(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    const keyword = filter.search;
    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);
      const regex = unsigned.trim().split(/\s+/).join('.*');
      filter.comicName_unsigned = { $regex: regex, $options: 'i' };
      delete filter.search;
    }

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 10);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.commentModel.countDocuments(filter),
      this.commentModel
        .find(filter)
        .populate('userId', 'name avatar')
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

  async adminHardDelete(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    const commentObjectId = new Types.ObjectId(id);

    try {
      const comment = await this.commentModel.findById(commentObjectId);
      if (!comment) throw new NotFoundException('Comment không tồn tại');

      const replies = await this.commentModel
        .find({ parent: commentObjectId })
        .select('_id');
      const replyIds = replies.map((r) => r._id);

      await this.commentModel.deleteOne({ _id: commentObjectId }, { session });
      await this.commentModel.deleteMany(
        { parent: commentObjectId },
        { session },
      );

      if (comment.parent) {
        await this.commentModel.updateOne(
          { _id: comment.parent },
          { $inc: { replyCount: -1 } },
          { session },
        );
      }

      await this.likeModel.deleteMany(
        { commentId: { $in: [commentObjectId, ...replyIds] } },
        { session },
      );
      await this.reportModel.deleteMany(
        { commentId: { $in: [commentObjectId, ...replyIds] } },
        { session },
      );

      await session.commitTransaction();
      return { deleted: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async adminBulkDelete(ids: string[]) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const objectIds = ids.map((id) => new Types.ObjectId(id));

      const comments = await this.commentModel
        .find({ _id: { $in: objectIds } })
        .select('_id parent');

      if (!comments.length)
        throw new NotFoundException('Không tìm thấy comment nào');

      const foundObjectIds = comments.map((c) => c._id as Types.ObjectId);

      const replies = await this.commentModel
        .find({ parent: { $in: foundObjectIds } })
        .select('_id');
      const replyObjectIds = replies.map((r) => r._id as Types.ObjectId);

      const allObjectIds = [...foundObjectIds, ...replyObjectIds];

      await this.commentModel.deleteMany(
        { _id: { $in: allObjectIds } },
        { session },
      );

      const replyComments = comments.filter((c) => c.parent);
      if (replyComments.length) {
        const bulkOps = replyComments.map((c) => ({
          updateOne: {
            filter: { _id: c.parent },
            update: { $inc: { replyCount: -1 } },
          },
        }));
        await this.commentModel.bulkWrite(bulkOps, { session });
      }

      await this.likeModel.deleteMany(
        { commentId: { $in: allObjectIds } },
        { session },
      );
      await this.reportModel.deleteMany(
        { commentId: { $in: allObjectIds } },
        { session },
      );

      await session.commitTransaction();
      return { deleted: true, count: allObjectIds.length };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  async adminGetReports(page: number, limit: number, qs: string) {
    const { filter } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, limit || 10);
    const offset = (safePage - 1) * safeLimit;

    const [totalItems, result] = await Promise.all([
      this.reportModel.countDocuments(filter),
      this.reportModel
        .find(filter)
        .populate('userId', 'name avatar')
        .populate('commentId')
        .sort({ createdAt: -1 })
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

  async adminResolveReport(id: string, status: ReportStatus) {
    const report = await this.reportModel.findById(id);
    if (!report) throw new NotFoundException('Report không tồn tại');

    report.status = status;
    await report.save();
    return report;
  }
}
