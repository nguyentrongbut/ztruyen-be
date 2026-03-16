// ** Nestjs
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ** Service
import { CommentsService } from './comments.service';

// ** Controller
import { CommentsController } from './comments.controller';

// ** Schema
import { Comment, CommentSchema } from './schemas/comment.schema';
import { CommentLike, CommentLikeSchema } from './schemas/comment-like.schema';
import {
  CommentReport,
  CommentReportSchema,
} from './schemas/comment-report.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { CommentsGateway } from './comments.gateway';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLike.name, schema: CommentLikeSchema },
      { name: CommentReport.name, schema: CommentReportSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsGateway],
})
export class CommentsModule {}
