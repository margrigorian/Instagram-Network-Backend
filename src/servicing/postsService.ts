import { publishPost } from "../db/slices/posts.js";
import { IPost } from "../db/types/postsSliceTypes.js";

export async function getElementsOfCaptionAndPostPublication(login: string, caption: string, images: Express.Multer.File[]): Promise<IPost> {
  // id поста
  const id = Math.random().toString(36).slice(2, 10);
  const hashtags_array: string[] = [];
  const user_links_array: string[] = [];

  if (caption.indexOf("#") !== -1) {
    getKeyWords("#");
  }
  if (caption.indexOf("@") !== -1) {
    getKeyWords("@");
  }

  function getKeyWords(symbol: string): void {
    // разбиваем по ключевому символу
    const arrayOfCaptionParts = caption.split(symbol);
    arrayOfCaptionParts.shift(); // убираем первый пустой элемент - ""

    arrayOfCaptionParts.map(part => {
      // пробел, #, @; по идее проверок должно быть больше
      const key_word = part.slice(
        0,
        part.indexOf(" ") !== -1
          ? part.indexOf(" ")
          : part.indexOf("#") !== -1
            ? part.indexOf("#")
            : part.indexOf("@") !== -1
              ? part.indexOf("@")
              : part.length
      );

      if (key_word) {
        if (symbol === "#") {
          hashtags_array.push(symbol + key_word);
        } else {
          // логины не проверяем, все будут кликабельны (нет аккаунта - значит нет)
          // так представлено и в инстаграмме
          user_links_array.push(symbol + key_word);
        }
      }
    });
  }

  let hashtags: string;
  if (hashtags_array.length !== 0) {
    hashtags = hashtags_array.join(";");
  } else {
    hashtags = "";
  }

  let user_links: string;
  if (user_links_array.length !== 0) {
    user_links = user_links_array.join(";");
  } else {
    user_links = "";
  }

  const imagesArray: string[] = images.map(el => el.filename);

  const post = await publishPost(id, imagesArray, caption, hashtags, user_links, login);
  return post;
}
