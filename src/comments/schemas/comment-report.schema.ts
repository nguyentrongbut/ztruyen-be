// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose'

export type CommentReportDocument = HydratedDocument<CommentReport>

@Schema({ timestamps: true })
export class CommentReport {

  @Prop({ type: Types.ObjectId })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId })
  commentId: Types.ObjectId

  @Prop()
  reason: string
}

export const CommentReportSchema =
  SchemaFactory.createForClass(CommentReport)