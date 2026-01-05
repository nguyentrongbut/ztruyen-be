export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
}

export interface IUserByGoogle {
  email: string;
  name: string;
  avatar: string;
}

export interface IUserByFacebook {
  email: string;
  name: string;
  avatar: string;
}
