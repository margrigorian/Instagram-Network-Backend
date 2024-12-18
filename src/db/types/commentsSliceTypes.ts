export interface IComment {
  id: number;
  content: string;
  hashtags: string | string[];
  user_links: string | string[];
  under_comment: number | null;
  user_login: string;
  avatar: string | null;
  verification: boolean;
  likes: string | string[] | null; // в последующем string преобразуем в string[]
  subcomments?: IComment[]; // subcomments добавляются в процессе, не сразу
}
