// ** NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schemas
import { Image } from '../../images/schemas/image.schema';

export type FrameDocument = HydratedDocument<Frame>;

@Schema({ timestamps: true })
export class Frame {
  @Prop({ type: Types.ObjectId, ref: Image.name })
  image: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  deletedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const FrameSchema = SchemaFactory.createForClass(Frame);
