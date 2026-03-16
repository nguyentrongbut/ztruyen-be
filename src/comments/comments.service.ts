// ** Nestjs
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

// ** Schema
import { Comment, CommentDocument } from './schemas/comment.schema';
import {
  CommentLike,
  CommentLikeDocument,
} from './schemas/comment-like.schema';
import {
  CommentReport,
  CommentReportDocument,
} from './schemas/comment-report.schema';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

// ** Mongoose
import { Model, Types } from 'mongoose';

// ** DTO
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';

// ** api query params
import aqp from 'api-query-params';

// ** Gateway
import { CommentsGateway } from './comments.gateway';

// ** Utils
import { filterBadWords } from '../utils/bad-word.filter';
import { extractMentions } from '../utils/mention.parser';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: Model<CommentDocument>,
    @InjectModel(CommentLike.name)
    private likeModel: Model<CommentLikeDocument>,
    @InjectModel(CommentReport.name)
    private reportModel: Model<CommentReportDocument>,
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private commentsGateway: CommentsGateway,
  ) {}

  private async checkSpam(userId: string) {
    const count = await this.commentModel.countDocuments({
      userId,
      createdAt: {
        $gte: new Date(Date.now() - 60000),
      },
    });

    if (count > 10) {
      throw new Error('Spam detected');
    }
  }

  async create(userId: string, dto: CreateCommentDto) {
    await this.checkSpam(userId);

    const content = filterBadWords(dto.content);

    const mentions = extractMentions(content);

    const comment = await this.commentModel.create({
      ...dto,
      userId,
      content,
    });

    if (dto.parentId) {
      await this.commentModel.updateOne(
        { _id: dto.parentId },
        { $inc: { replyCount: 1 } },
      );
    }

    /*
    ======================
    MENTION NOTIFICATION
    ======================
    */

    for (const username of mentions) {
      const user = await this.userModel.findOne({ username });

      if (!user) continue;

      const notification = await this.notificationModel.create({
        receiverId: user._id,
        senderId: userId,
        type: 'mention',
        commentId: comment._id,
      });

      this.commentsGateway.notifyUser(user._id.toString(), notification);
    }

    /*
    ======================
    REALTIME COMMENT
    ======================
    */

    this.commentsGateway.broadcastComment(comment);

    return comment;
  }

  async like(userId: string, commentId: string) {
    const exist = await this.likeModel.findOne({
      userId,
      commentId,
    });

    if (exist) {
      await this.likeModel.deleteOne({ _id: exist._id });

      await this.commentModel.updateOne(
        { _id: commentId },
        { $inc: { likeCount: -1 } },
      );

      return { liked: false };
    }

    await this.likeModel.create({
      userId,
      commentId,
    });

    await this.commentModel.updateOne(
      { _id: commentId },
      { $inc: { likeCount: 1 } },
    );

    return { liked: true };
  }

  async report(userId: string, dto: ReportCommentDto) {
    await this.reportModel.create({
      userId,
      commentId: dto.commentId,
      reason: dto.reason,
    });

    await this.commentModel.updateOne(
      { _id: dto.commentId },
      { $inc: { reportCount: 1 } },
    );

    return { reported: true };
  }

  async getComments(page: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    filter.parentId = null;
    filter.isDeleted = false;

    const offset = (+page - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;

    const totalItems = await this.commentModel.countDocuments(filter);

    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.commentModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .exec();

    return {
      meta: {
        page,
        limit: defaultLimit,
        totalPages,
        totalItems,
      },
      result,
    };
  }

  async getReplies(parentId: string) {
    return this.commentModel.find({ parentId }).sort({ createdAt: 1 });
  }
}
