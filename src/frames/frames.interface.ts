import { Types } from 'mongoose';

export interface IFrame {
  _id: string;
  name: string;
  image: Types.ObjectId;
  createdAt?: Date;
}