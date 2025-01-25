import path from "path";
import fs from "fs/promises";
import { deleteImage, deletePost, getPostsImages, publishPost, updatePost } from "../db/slices/posts.js";
import { getHashtagsAndUserLinks } from "../lib/getHashtagsAndUserLinksFunction.js";
import { IImage, IPost } from "../db/types/postsSliceTypes.js";

export async function getKeywordsOfCaptionAndPostPublication(login: string, caption: string, images: Express.Multer.File[]): Promise<IPost> {
  // id поста
  const id = Math.random().toString(36).slice(2, 10);
  const keyWords = getHashtagsAndUserLinks(caption);
  const imagesArray: string[] = images.map(el => el.filename);

  const post = await publishPost(id, imagesArray, caption, keyWords.hashtags, keyWords.user_links, login);
  return post;
}

export async function getKeywordsOfCaptionAndUpdatePublication(post_id: string, caption: string, login: string): Promise<IPost> {
  const keyWords = getHashtagsAndUserLinks(caption);
  const post = await updatePost(post_id, caption, keyWords.hashtags, keyWords.user_links);
  return post;
}

export async function deletePublication(post_id: string): Promise<IPost> {
  // сначала получаем имена изображений
  const posts_images = await getPostsImages(post_id);
  // после удалем пост из базы
  const deletedPublication = await deletePost(post_id);
  // удаляем изображения из папки posts_images
  const posts_images_folder = path.join(path.resolve(), "posts_images");
  posts_images.map(el => {
    const absolute_path_to_image: string = path.join(posts_images_folder, el.image);
    fs.unlink(absolute_path_to_image);
  });
  return deletedPublication;
}

export async function deletePostsImage(post_id: string, image: IImage): Promise<void> {
  await deleteImage(post_id, Number(image.img_index));
  const posts_images_folder = path.join(path.resolve(), "posts_images");
  const absolute_path_to_image: string = path.join(posts_images_folder, image.image);
  fs.unlink(absolute_path_to_image);
}
