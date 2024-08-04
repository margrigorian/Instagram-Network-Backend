export interface IPost {
  id: string;
  caption: string;
  hashtags: string;
  user_links: string;
  time: number;
  likes: number;
  comments: number;
  images?: IImage[]; // ? - так как images добавляем позже, после запроса постов
}

export interface IImage {
  img_index: number;
  image: string;
  post_id?: string;
}
