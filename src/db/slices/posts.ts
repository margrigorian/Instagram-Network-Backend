import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IPost, IImage, ISearchPost, IUserLikeOnPost } from "../types/postsSliceTypes.js";

const imagesFolderUrl: string = "http://localhost:3001/posts_images/";
const avatarsFolderUrl: string = "http://localhost:3001/users_avatars/";

// (SELECT COUNT(*) FROM likes_on_posts WHERE post_id = p.id) AS likes_number FROM posts AS p

export async function getPosts(key: string = "", value: string = ""): Promise<IPost[]> {
  const filters: string[] = [];
  const params: string[] = [];

  if (key === "login") {
    filters.push("p.user_login = ?");
    params.push(value);
  } else if (key === "hashtag") {
    filters.push("p.hashtags LIKE ? || p.hashtags LIKE ? || p.hashtags LIKE ? || p.hashtags LIKE ?");
    params.push(value, `${value};%`, `%;${value};%`, `%;${value}`);
  } else if (key === "follower") {
    filters.push("s.login_of_follower = ");
    params.push(value);
  } else if (key === "id") {
    filters.push("p.id = ?");
    params.push(value);
  }

  // т.к. исп. агрег. функция (COUNT) при SELECT id, image, необходим GROUP BY
  // без подзапросов получить реальное число ком., лайков не получалось, все перемножалось
  const posts: [(RowDataPacket & IPost)[], FieldPacket[]] = await db.query(
    `
      SELECT p.id AS id, p.caption AS caption, p.hashtags AS hashtags, p.user_links AS user_links, 
      p.time AS time, p.user_login AS user_login, u.verification AS verification, a.image AS avatar,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_number,
      GROUP_CONCAT(DISTINCT l.user_login) AS likes FROM posts AS p
      LEFT JOIN users AS u ON u.login = p.user_login
      LEFT JOIN users_avatars AS a ON a.user_login = p.user_login
      LEFT JOIN comments AS c ON c.post_id = p.id
      LEFT JOIN likes_on_posts AS l ON l.post_id = p.id
      LEFT JOIN subscriptions AS s ON s.login_of_following = p.user_login
      ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
      GROUP BY id, avatar
      ORDER BY time DESC
    `,
    params
  );

  // через функцию выше можно запросить посты к аккаунту, посты по хештегу, конкретный пост по его id
  // все посты в разделе "интересное"

  if (posts[0].length > 0) {
    const promisesOfImagesArray: Promise<IImage[]>[] = posts[0].map(el => {
      // по id поста запрашиваем изображения
      return getPostsImages(el.id);
    });

    const images: IImage[][] = await Promise.all(promisesOfImagesArray).then(result => result);

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

export async function getPostsImages(id: string): Promise<IImage[]> {
  // массивы изображения будут в треубуемом порядке по отношению к постам
  const image: [(RowDataPacket & IImage)[], FieldPacket[]] = await db.query(
    `SELECT img_index, image FROM posts_images WHERE post_id = "${id}" ORDER BY img_index ASC`
  );
  return image[0];
}

// для внутренних проверок, быстрого поиска
export async function getPost(post_id: string): Promise<ISearchPost | null> {
  const post: [(RowDataPacket & ISearchPost)[], FieldPacket[]] = await db.query(
    `SELECT p.id as id, p.user_login as user_login FROM posts as p WHERE id = ?`,
    [post_id]
  );

  if (post[0].length > 0) {
    return post[0][0];
  }

  return null;
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
        VALUES("${id}", ?, ?, ?, "${user_login}", "${post_time}")
    `,
    [caption, hashtags, user_links]
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
  const post = await getPosts("id", id);

  return post[0];
}

export async function updatePost(post_id: string, caption: string, hashtags: string, user_links: string): Promise<IPost> {
  await db.query(
    `
      UPDATE posts SET caption = ?, hashtags = ?, user_links = ? WHERE id = "${post_id}"
    `,
    [caption, hashtags, user_links]
  );
  // запрашивам данные обновленного поста
  const post = await getPosts("id", post_id);
  return post[0];
}

export async function deleteImage(post_id: string, img_index: number): Promise<void> {
  await db.query(
    `
      DELETE FROM posts_images WHERE post_id = "${post_id}" AND img_index = "${img_index}"
    `
  );
}

export async function deletePost(post_id: string): Promise<IPost> {
  const deletedPost = await getPosts("id", post_id);
  await db.query(`DELETE FROM posts WHERE id = "${post_id}"`);
  return deletedPost[0];
}

export async function getUserLikeOnPost(post_id: string, login: string): Promise<IUserLikeOnPost | null> {
  const like: [(RowDataPacket & IUserLikeOnPost)[], FieldPacket[]] = await db.query(
    `SELECT * FROM likes_on_posts WHERE post_id = "${post_id}" AND user_login = "${login}"`
  );

  if (like[0][0]) {
    return like[0][0];
  }

  return null;
}

export async function addLikeToPost(post_id: string, login: string): Promise<IUserLikeOnPost | null> {
  await db.query(`INSERT INTO likes_on_posts(post_id, user_login) VALUE("${post_id}", "${login}")`);
  return getUserLikeOnPost(post_id, login);
}

export async function deleteUserLikeOnPost(liked_post_id: string, login: string): Promise<void> {
  await db.query(
    `
      DELETE FROM likes_on_posts WHERE post_id = "${liked_post_id}" AND user_login = "${login}"
    `
  );
}
