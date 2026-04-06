// ** NestJS
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ** Schemas
import { Comment, CommentSchema } from './schemas/comment.schema';
import { CommentLike, CommentLikeSchema } from './schemas/comment-like.schema';
import {
  CommentReport,
  CommentReportSchema,
} from './schemas/comment-report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

// ** Module files
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

// ** Feature modules
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLike.name, schema: CommentLikeSchema },
      { name: CommentReport.name, schema: CommentReportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}