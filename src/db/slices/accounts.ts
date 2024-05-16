import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getUser } from "./users.js";
import { IPost, IAccount, IImage } from "../types/accountsSliceTypes.js";

export async function getAccountInfo(login: string): Promise<IAccount | null> {
  const user = await getUser(login);

  // чтобы исключить лишние действия
  if (user) {
    delete user.password;

    const followers: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query(
      `SELECT id_of_follower AS id FROM subscriptions WHERE login_of_following = "${login}"`
    );

    const following: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
      `SELECT login_of_following AS login FROM subscriptions
      WHERE id_of_follower = (SELECT id FROM users WHERE login = "${login}")`
    );

    // т.к. исп. агрег. функция (COUNT) при SELECT id, image необходим GROUP BY
    // без подзапросов получить реальное число ком., лайков не получалось, все перемножалось
    const posts: [(RowDataPacket & IPost)[], FieldPacket[]] = await db.query(
      `
        SELECT p.id AS id, (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_number,
        (SELECT COUNT(*) FROM likes_on_posts WHERE post_id = p.id) AS likes_number FROM posts AS p
        LEFT JOIN comments AS c ON p.id = c.post_id
        LEFT JOIN likes_on_posts AS l ON p.id = l.post_id
        WHERE p.user_login = "${login}"
        GROUP BY id
        ORDER BY id DESC
      `
    );

    const images: [(RowDataPacket & IImage)[], FieldPacket[]] = await db.query(`SELECT * FROM images`);

    posts[0].map(el => {
      el.images = [];
      images[0].forEach(item => {
        if (item.post_id === el.id) {
          const image = item;
          delete image.post_id;
          el.images?.push(item);
        }
      });
    });

    return {
      user,
      followers: followers[0],
      following: following[0],
      posts: posts[0]
    };
  }

  return null;
}
