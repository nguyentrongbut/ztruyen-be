// ** Nest js
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { User } from '../../users/schemas/user.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  userId: Types.ObjectId;

  @Prop({ index: true })
  comicSlug: string;

  @Prop({ index: true })
  comicName: string;

  @Prop({ index: true })
  comicName_unsigned: string;

  @Prop({ default: null })
  chapterName: string | null;

  @Prop({ default: null, index: true })
  chapterId: string | null;

  @Prop({ type: Number, default: null, index: true })
  page: number | null;

  @Prop({ type: Types.ObjectId, ref: Comment.name, default: null, index: true })
  parent: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  replyTo: Types.ObjectId | null;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0, index: true })
  likeCount: number;

  @Prop({ default: 0 })
  replyCount: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ comicSlug: 1, chapterId: 1, parent: 1, createdAt: -1 });
CommentSchema.index({ comicSlug: 1, chapterId: 1, likeCount: -1 });
CommentSchema.index({ comicSlug: 1, chapterId: 1, page: 1, parent: 1 });
CommentSchema.index({ comicName_unsigned: 1, createdAt: -1 });
