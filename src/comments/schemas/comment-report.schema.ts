// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { User } from '../../users/schemas/user.schema';
import { Comment } from './comment.schema';

// ** Enum
import { ReportStatus } from '../../configs/enums/comment.enum';

export type CommentReportDocument = HydratedDocument<CommentReport>;

@Schema({ timestamps: true })
export class CommentReport {
  @Prop({ type: Types.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Comment.name })
  commentId: Types.ObjectId;

  @Prop()
  reason: string;

  @Prop({ enum: ReportStatus, default: ReportStatus.PENDING, index: true })
  status: ReportStatus
}

export const CommentReportSchema = SchemaFactory.createForClass(CommentReport);

CommentReportSchema.index({ userId: 1, commentId: 1 }, { unique: true })
CommentReportSchema.index({ status: 1, createdAt: -1 })