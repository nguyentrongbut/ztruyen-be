// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { Image } from '../../images/schemas/image.schema';

export type EmojiCategoryDocument = HydratedDocument<EmojiCategory>;

@Schema({ timestamps: true })
export class EmojiCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ index: true })
  name_unsigned: string;

  @Prop({ type: Types.ObjectId, ref: Image.name, required: true })
  image: Types.ObjectId;

  @Prop({ default: 0, index: true })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmojiCategorySchema = SchemaFactory.createForClass(EmojiCategory);