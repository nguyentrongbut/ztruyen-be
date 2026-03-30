// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { Image } from '../../images/schemas/image.schema';
import { EmojiCategory } from '../../emoji-categories/schemas/emoji-category.schema';

// ** Enum
import { EmojiType } from '../../configs/enums/emoji.enum';

export type EmojiDocument = HydratedDocument<Emoji>;

@Schema({ timestamps: true })
export class Emoji {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ index: true })
  name_unsigned: string;

  @Prop({ enum: EmojiType, default: EmojiType.IMAGE, index: true })
  type: EmojiType;

  @Prop({ type: Types.ObjectId, ref: Image.name })
  image?: Types.ObjectId;

  @Prop()
  text?: string;

  @Prop({ type: Types.ObjectId, ref: EmojiCategory.name, required: true, index: true })
  category: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmojiSchema = SchemaFactory.createForClass(Emoji);
