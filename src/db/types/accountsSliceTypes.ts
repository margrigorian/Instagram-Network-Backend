import { IUser } from "./usersSliceTypes.js";
import { IPost } from "./postsSliceTypes.js";

export interface IAccount {
  user: IUser;
  posts: IPost[];
  followers_count: number;
  followings_count: number;
}

export interface IListedAccount {
  login: string;
  username: string;
  avatar: string | null;
  verification: number | boolean;
  // СВОЙСТВА, НЕОБХОДИМЫЕ РЕКОМЕНДОВАННЫМ АККАУНТАМ
  followers?: string;
  // для группировки аккаунтов по количеству их подписчиков
  followers_count?: number;
  // СВОЙСТВО, НЕОБХОДИМО ПРИ SEARCH
  // подписан ли пользователь на найденный аккаунт
  follow_account?: boolean;
  deleted?: boolean;
}

export interface ISubsciption {
  login_of_follower: string;
  login_of_following: string;
}
