export interface IUser {
  id?: number; // ? - не отправляем на фронт
  login: string;
  username: string | null;
  contact?: string; // ? - не отправляем на фронт
  password?: string; // ? - чтобы в процессе мы могли его удалить
  avatar: string | null;
  about: string;
  gender: string | null;
  verification: boolean;
  recommendation: boolean;
}

export interface IAvatar {
  user_login: string;
  image: string;
}

export interface IUserSubscriptions {
  followers: { login: string }[];
  followings: { login: string }[];
}
