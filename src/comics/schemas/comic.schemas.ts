// ** Nestjs
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument } from 'mongoose';

export type ComicDocument = HydratedDocument<Comic>;

@Schema({ timestamps: true })
export class Comic {
  @Prop({ required: true })
  name: string;

  @Prop({ index: true })
  name_unsigned: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  thumb_url: string;

  @Prop({ type: [String], default: [] })
  authors: string[];

  @Prop({ default: 'ongoing' })
  status: string;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop()
  latest_chapter: string;

  @Prop()
  chapter_api_data: string;

  @Prop()
  country: string;

  @Prop({ index: true })
  rank: number;
}

export const ComicSchema = SchemaFactory.createForClass(Comic);
ComicSchema.index({ rank: 1 });
ComicSchema.index({ country: 1, rank: 1 });
ComicSchema.index({ genres: 1 });
ComicSchema.index({ slug: 1 }, { unique: true });