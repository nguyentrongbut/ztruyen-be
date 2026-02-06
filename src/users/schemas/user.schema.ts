// ** NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// ** Mongoose
import { HydratedDocument, Types } from 'mongoose';

// ** Schemas
import { Image } from '../../images/schemas/image.schema';

// ** Enums
import { GenderType, ProviderType, RoleType } from '../../configs/enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: null })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: Image.name })
  cover: Types.ObjectId;

  @Prop()
  bio: string;

  @Prop({ type: Types.ObjectId, ref: Image.name })
  avatar: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Image.name })
  avatar_frame: Types.ObjectId;

  @Prop()
  age: number;

  @Prop({
    type: String,
    enum: GenderType,
    default: GenderType.MALE,
  })
  gender: GenderType;

  @Prop()
  birthday: Date;

  @Prop({
    type: String,
    enum: RoleType,
    default: RoleType.USER,
  })
  role: RoleType;

  @Prop({
    type: String,
    enum: Object.values(ProviderType),
    default: ProviderType.LOCAL,
  })
  provider: ProviderType;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpiry?: Date;

  @Prop()
  refreshToken: string;

  @Prop()
  deletedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
