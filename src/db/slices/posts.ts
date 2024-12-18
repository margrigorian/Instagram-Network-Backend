import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IPost, IImage } from "../types/postsSliceTypes.js";
import { string } from "zod";

const imagesFolderUrl: string = "http://localhost:3001/posts_images/";
const avatarsFolderUrl: string = "http://localhost:3001/users_avatars/";

// (SELECT COUNT(*) FROM likes_on_posts WHERE post_id = p.id) AS likes_number FROM posts AS p

export async function getPosts(key: string, value: string): Promise<(RowDataPacket & IPost)[]> {
  // т.к. исп. агрег. функция (COUNT) при SELECT id, image необходим GROUP BY
  // без подзапросов получить реальное число ком., лайков не получалось, все перемножалось
  const posts: [(RowDataPacket & IPost)[], FieldPacket[]] = await db.query(
    `
      SELECT p.id AS id, p.caption AS caption, p.hashtags AS hashtags, p.user_links AS user_links, 
      p.time AS time, p.user_login AS user_login, u.verification AS verification, a.image AS avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_number,
      GROUP_CONCAT(DISTINCT l.user_login) AS likes FROM posts AS p
      LEFT JOIN users AS u ON u.login = p.user_login
      LEFT JOIN comments AS c ON c.post_id = p.id
      LEFT JOIN likes_on_posts AS l ON l.post_id = p.id
      LEFT JOIN users_avatars AS a ON a.user_login = p.user_login
      ${
        key === "login"
          ? `WHERE p.user_login = "${value}"`
          : key === "hashtag"
            ? `WHERE p.hashtags LIKE "${value}" || p.hashtags LIKE "${value};%" || p.hashtags LIKE "%;${value};%" || p.hashtags LIKE "%;${value}"`
            : key === "id"
              ? `WHERE p.id = "${value}"`
              : ""
      }
      GROUP BY id, avatar
      ORDER BY time DESC
    `
  );
  // через функцию выше можно запросить посты к аккаунту, посты по хештегу, конркетный пост по его id
  // все посту в разделе "интересное"

  if (posts[0].length > 0) {
    const promisesOfImagesArray: Promise<(RowDataPacket & IImage)[]>[] = posts[0].map(el => {
      // по id поста запрашиваем изображения
      return getPostsImages(el.id);
    });

    const images: (RowDataPacket & IImage)[][] = await Promise.all(promisesOfImagesArray).then(result => result);

    // выстраиваем путь к изображениям
    images.map(arr => {
      arr.map(item => (item.image = imagesFolderUrl + item.image));
      return arr;
    });

    // добавляем изображения к постам, путь к папке аватарок
    posts[0].map((el, i) => {
      if (el.avatar) {
        el.avatar = avatarsFolderUrl + el.avatar;
      }
      el.images = images[i];
      // проверка, требуемая типизацией
      if (typeof el.hashtags === "string" && typeof el.user_links === "string") {
        if (el.hashtags) {
          el.hashtags = el.hashtags.split(";");
        } else {
          // переводим в массив, нужно для frontend
          el.hashtags = [];
        }

        if (el.user_links) {
          el.user_links = el.user_links.split(";");
        } else {
          // переводим в массив, нужно для frontend
          el.user_links = [];
        }
      }
      // проверка, требуемая типизацией
      if (typeof el.likes === "string") {
        el.likes = el.likes.split(",");
      } else {
        el.likes = [];
      }
      return el;
    });
  }

  return posts[0];
}

async function getPostsImages(id: string): Promise<(RowDataPacket & IImage)[]> {
  // массивы изображения будут в треубуемом порядке по отношению к постам
  const image: [(RowDataPacket & IImage)[], FieldPacket[]] = await db.query(
    `SELECT img_index, image FROM posts_images WHERE post_id = "${id}" ORDER BY img_index ASC`
  );
  return image[0];
}

export async function publishPost(
  id: string,
  images: string[],
  caption: string,
  hashtags: string,
  user_links: string,
  user_login: string
): Promise<IPost> {
  // время публикации
  const post_time = Date.now();

  //   вносим пост
  await db.query(
    `
        INSERT INTO posts(id, caption, hashtags, user_links, user_login, time) 
        VALUES("${id}", "${caption}", ?, ?, "${user_login}", ?)
    `,
    [hashtags, user_links, post_time]
  );

  const expression: string[] = [];
  const params: (string | number)[] = [];

  images.forEach(async (el, i) => {
    expression.push("(?, ?, ?)");
    params.push(i + 1); // чтобы расчет шел с 1
    params.push(el);
    params.push(id);
  });

  // загружаем изображения
  await db.query(`INSERT INTO posts_images(img_index, image, post_id) VALUES ${expression.join(",")}`, params);

  // запрашивам данные нового поста
  const post = await getPosts("post", id);

  return post[0];
}
