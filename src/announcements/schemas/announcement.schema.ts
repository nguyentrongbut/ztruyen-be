// ** NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument } from 'mongoose';

export type AnnouncementDocument = HydratedDocument<Announcement>;

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  MAINTENANCE = 'maintenance',
  EVENT = 'event',
}

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: AnnouncementType,
    default: AnnouncementType.INFO,
  })
  type: AnnouncementType;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({ isActive: 1 });