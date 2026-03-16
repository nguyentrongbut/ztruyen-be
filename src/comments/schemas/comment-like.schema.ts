// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose'

export type CommentLikeDocument = HydratedDocument<CommentLike>

@Schema({ timestamps: true })
export class CommentLike {

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, required: true })
  commentId: Types.ObjectId
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike)

CommentLikeSchema.index(
  { userId: 1, commentId: 1 },
  { unique: true }
)