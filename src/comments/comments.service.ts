import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import aqp from 'api-query-params';

import { Comment, CommentDocument } from './schemas/comment.schema';
import {
  CommentLike,
  CommentLikeDocument,
} from './schemas/comment-like.schema';
import {
  CommentReport,
  CommentReportDocument,
} from './schemas/comment-report.schema';
import { checkSpam } from '../utils/anti-spam';
import { filterBadWords } from '../utils/filter-words';
import { removeVietnameseTones } from '../utils/removeVietnameseTones';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReportStatus } from '../configs/enums/comment.enum';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentLike.name)
    private likeModel: Model<CommentLikeDocument>,
    @InjectModel(CommentReport.name)
    private reportModel: Model<CommentReportDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

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

  async createReply(dto: CreateReplyDto, userId: string) {
    checkSpam(userId);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const parent = await this.commentModel
        .findById(dto.parent)
        .select(
          'comicSlug comicName comicName_unsigned chapterId chapterName page',
        );
      if (!parent) throw new NotFoundException();

      const content = filterBadWords(dto.content);

      const comment = await this.commentModel.create(
        [
          {
            ...dto,
            userId,
            content,
            parent: dto.parent ? new Types.ObjectId(dto.parent) : undefined,
            replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
            comicSlug: parent.comicSlug,
            comicName: parent.comicName,
            comicName_unsigned: parent.comicName_unsigned,
            chapterId: parent.chapterId,
            chapterName: parent.chapterName,
            page: parent.page,
          },
        ],
        { session },
      );

      await this.commentModel.updateOne(
        { _id: dto.parent },
        { $inc: { replyCount: 1 } },
        { session },
      );

      await session.commitTransaction();
      return comment[0];
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

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
        .sort((sort as any) || { createdAt: -1 })
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
        [
          {
            commentId: commentObjectId,
            userId: userObjectId,
          },
        ],
        { session },
      );

      await this.commentModel.updateOne(
        { _id: commentId },
        { $inc: { likeCount: 1 } },
        { session },
      );

      await session.commitTransaction();
      return { liked: true };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

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

  async delete(id: string, userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    const commentObjectId = new Types.ObjectId(id);

    try {
      const comment = await this.commentModel.findById(commentObjectId);

      if (!comment) {
        throw new NotFoundException('Bình luận không tồn tại');
      }

      if (comment.userId.toString() !== userId.toString()) {
        throw new ForbiddenException('Không có quyền xóa');
      }

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

  //   Admin
  async adminGetComments(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    const keyword = filter.search;
    if (keyword) {
      const unsigned = removeVietnameseTones(keyword);
      const regex = unsigned.trim().split(/\s+/).join('.*');

      filter.comicName_unsigned = {
        $regex: regex,
        $options: 'i',
      };

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

      // Cập nhật replyCount của parent nếu comment bị xóa là reply
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

    if (!report) {
      throw new NotFoundException('Report không tồn tại');
    }

    report.status = status;
    await report.save();

    return report;
  }
}
