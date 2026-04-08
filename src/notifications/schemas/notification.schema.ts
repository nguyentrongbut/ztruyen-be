// ** NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Enum
import { NotificationType } from '../../configs/enums/notification.schema';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  commentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  replyId: Types.ObjectId;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({
    type: {
      senderName: String,
      senderAvatar: String,
      comicName: String,
      comicSlug: String,
      chapterId: String,
      contentPreview: String,
    },
    _id: false,
  })
  meta: {
    senderName: string;
    senderAvatar?: string;
    comicName?: string;
    comicSlug?: string;
    chapterId?: string;
    contentPreview?: string;
  };
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 } // auto delete after 30 days
);
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });