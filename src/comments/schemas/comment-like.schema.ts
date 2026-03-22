// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { User } from '../../users/schemas/user.schema';

export type CommentLikeDocument = HydratedDocument<CommentLike>;

@Schema({ timestamps: true })
export class CommentLike {
  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: CommentLike.name, index: true })
  commentId: Types.ObjectId
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

CommentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true })