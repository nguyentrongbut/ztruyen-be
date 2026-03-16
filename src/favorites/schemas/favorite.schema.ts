// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schema
import { User } from '../../users/schemas/user.schema';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  comic_slug: string;

  @Prop()
  comic_name: string;

  @Prop({ index: true })
  comic_name_unsigned: string;

  @Prop()
  comic_cover: string;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ userId: 1, comic_slug: 1 }, { unique: true });
FavoriteSchema.index({ userId: 1, comic_name_unsigned: 1, });
