import { IUser } from "./usersSliceTypes.js";
import { IPost, IImage } from "./postsSliceTypes.js";

export interface IAccount {
  user: IUser;
  followers: { login: string }[];
  following: { login: string }[];
  posts: IPost[];
}
