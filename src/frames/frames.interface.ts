import { Types } from 'mongoose';

export interface IFrame {
  _id: string;
  name: string;
  name_unsigned: string;
  image: Types.ObjectId;
  createdAt?: Date;
}