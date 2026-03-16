// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {

  @Prop({ type: Types.ObjectId })
  receiverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  senderId: Types.ObjectId;

  @Prop()
  type: string;

  @Prop({ type: Types.ObjectId })
  commentId: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);