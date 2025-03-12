import { IUser } from "./usersSliceTypes.js";
import { IPost } from "./postsSliceTypes.js";

export interface IAccount {
  user: IUser;
  posts: IPost[];
  followers_count: number;
  followings_count: number;
}

export interface IRecommendedAccount {
  login: string;
  username: string;
  avatar: string | null;
  verifiaction: boolean;
  followers?: string;
  // для группировки аккаунтов по количеству их подписчиков
  followers_count?: number;
}

export interface ISearchAccount {
  login: string;
  username: string | null;
  avatar: string | null;
  verifiaction: boolean;
  follow_account?: boolean;
}

export interface ISubsciption {
  login_of_follower: string;
  login_of_following: string;
}
