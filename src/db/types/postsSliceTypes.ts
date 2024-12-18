export interface IPost {
  id: string;
  caption: string;
  hashtags: string | string[];
  user_links: string | string[];
  time: number;
  user_login: string;
  avatar: string;
  verification: boolean;
  likes: string | string[] | null; // в последующем string преобразуем в string[]
  // likes: number;
  comments: number;
  images?: IImage[]; // ? - так как images добавляем позже, после запроса постов
}

export interface IImage {
  img_index: number;
  image: string;
  post_id?: string;
}
