import { publishPost } from "../db/slices/posts.js";
import { IPost } from "../db/types/postsSliceTypes.js";
import { getHashtagsAndUserLinks } from "../lib/getHashtagsAndUserLinksFunction.js";

export async function getKeyWordsOfCaptionAndPostPublication(login: string, caption: string, images: Express.Multer.File[]): Promise<IPost> {
  // id поста
  const id = Math.random().toString(36).slice(2, 10);
  const keyWords = getHashtagsAndUserLinks(caption);
  const imagesArray: string[] = images.map(el => el.filename);

  const post = await publishPost(id, imagesArray, caption, keyWords.hashtags, keyWords.user_links, login);
  return post;
}
