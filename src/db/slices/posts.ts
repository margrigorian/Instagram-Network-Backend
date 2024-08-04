import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IPost, IImage } from "../types/postsSliceTypes.js";

const url: string = "http://localhost:3001/posts_images/";

export async function getPosts(key: string, value: string): Promise<(RowDataPacket & IPost)[]> {
  // т.к. исп. агрег. функция (COUNT) при SELECT id, image необходим GROUP BY
  // без подзапросов получить реальное число ком., лайков не получалось, все перемножалось
  const posts: [(RowDataPacket & IPost)[], FieldPacket[]] = await db.query(
    `
        SELECT p.id AS id, p.caption AS caption, p.hashtags AS hashtags, p.user_links AS user_links, p.time AS time,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_number,
        (SELECT COUNT(*) FROM likes_on_posts WHERE post_id = p.id) AS likes_number FROM posts AS p
        LEFT JOIN comments AS c ON p.id = c.post_id
        LEFT JOIN likes_on_posts AS l ON p.id = l.post_id
        ${
          key === "login"
            ? `WHERE p.user_login = "${value}"`
            : key === "hashtag"
              ? `WHERE p.hashtags LIKE "${value}" || p.hashtags LIKE "${value};%" || p.hashtags LIKE "%;${value};%" || p.hashtags LIKE "%;${value}"`
              : `WHERE p.id = "${value}"`
        }
        GROUP BY id
        ORDER BY time DESC
      `
  );
  // через функцию выше можно запросить посты к аккаунту, посты по хештегу, конркетный пост по его id

  const promisesOfImagesArray: Promise<(RowDataPacket & IImage)[]>[] = posts[0].map(el => {
    // по id поста запрашиваем изображения
    return getPostsImages(el.id);
  });

  const images: (RowDataPacket & IImage)[][] = await Promise.all(promisesOfImagesArray).then(result => result);

  // выстраиваем путь к изображениям
  images.map(arr => {
    arr.map(item => (item.image = url + item.image));
    return arr;
  });

  // добавляем изображения к постам
  posts[0].map((el, i) => {
    el.images = images[i];
    // el.hashtags = el.hashtags.split(";");
    // el.user_links = el.hashtags.split(";");
    return el;
  });

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
