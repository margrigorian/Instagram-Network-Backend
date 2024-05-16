import { IUser } from "./usersSliceTypes.js";

export interface IPost {
  id: string;
  likes: number;
  comments: number;
  images?: IImage[];
}

export interface IImage {
  img_index: number;
  image: string;
  post_id?: string;
}

export interface IAccount {
  user: IUser;
  followers: { id: number }[];
  following: { login: string }[];
  posts: IPost[];
}
