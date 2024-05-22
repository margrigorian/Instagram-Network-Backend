import { IUser } from "./usersSliceTypes.js";

export interface IPost {
  id: string;
  likes: number;
  comments: number;
  images?: IImage[]; // ? - так как images добавляе позже, после запроса постов
}

export interface IImage {
  img_index: number;
  image: string;
  post_id?: string;
}

export interface IAccount {
  user: IUser;
  followers: { login: string }[];
  following: { login: string }[];
  posts: IPost[];
}
