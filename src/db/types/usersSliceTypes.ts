export interface IUser {
  id: number;
  login: string;
  username: string | null;
  password?: string; // ? - чтобы в процессе мы могли его удалить
  avatar: string | null;
  about?: string | null;
  gender?: string | null;
  verification: boolean;
  recommendation: boolean; // рекомендации другого пользователя не должны присутствовать
}
