export interface IPost {
  id: string;
  caption: string;
  hashtags: string | string[];
  user_links: string | string[];
  user_login: string;
  time: number;
  avatar: string;
  verification: number | boolean;
  likes: string | string[] | null; // в последующем string преобразуем в string[]
  comments: number;
  images?: IImage[]; // ? - так как images добавляем позже, после запроса постов
}

export interface IImage {
  img_index: number;
  image: string;
  post_id?: string;
}

export interface ISearchPost {
  id: string;
  user_login: string;
}

export interface IUserLikeOnPost {
  comment_id: number;
  user_login: string;
}
