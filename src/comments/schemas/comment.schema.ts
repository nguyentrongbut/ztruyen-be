// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose'

// ** Schema
import { User } from '../../users/schemas/user.schema'

export type CommentDocument = HydratedDocument<Comment>

@Schema({ timestamps: true })
export class Comment {

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true
  })
  userId: Types.ObjectId

  @Prop({ required: true, index: true })
  comic_slug: string

  @Prop({ index: true })
  chapter_id?: string

  @Prop()
  page?: number

  @Prop({ required: true })
  content: string

  @Prop({
    type: Types.ObjectId,
    ref: Comment.name,
    default: null,
    index: true
  })
  parentId?: Types.ObjectId

  @Prop({ default: 0 })
  likeCount: number

  @Prop({ default: 0 })
  replyCount: number

  @Prop({ default: false })
  isDeleted: boolean

  @Prop({ default: 0 })
  reportCount: number
}

export const CommentSchema = SchemaFactory.createForClass(Comment)

CommentSchema.index({
  comic_slug: 1,
  chapter_id: 1,
  parentId: 1,
  createdAt: -1
})