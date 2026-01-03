// ** NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { Document } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema({ timestamps: true })
export class Image {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  fileId: string;

  @Prop()
  createdAt: Date;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
