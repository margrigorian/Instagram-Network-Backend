import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IComment } from "../types/commentsSliceTypes.js";

const avatarsFolderUrl: string = "http://localhost:3001/users_avatars/";

export async function getComments(post_id: string): Promise<IComment[]> {
  const commentArrayFromDB: IComment[] = await getCommentArrayFromDB(0, post_id);

  const commentArrayPromises: Promise<IComment>[] = commentArrayFromDB.map(async el => {
    const subcomments: IComment[] = await getCommentArrayFromDB(1, el.id);
    el.subcomments = subcomments;
    return el;
  });
  const comments: IComment[] = await Promise.all(commentArrayPromises).then(resuilt => resuilt);

  return comments;
}

async function getCommentArrayFromDB(indexOfCondition: number, id: string | number): Promise<IComment[]> {
  const conditions: string[] = [`c.post_id = ? AND under_comment IS NULL`, "under_comment = ?"];
  const commentArrayFromDB: [(RowDataPacket & IComment)[], FieldPacket[]] = await db.query(
    `
      SELECT c.id AS id, c.content AS content, c.hashtags AS hashtags, c.user_links AS user_links, 
      c.under_comment AS under_comment, c.user_login AS user_login, a.image AS avatar, u.verification AS verification, 
      GROUP_CONCAT(l.user_login) AS likes FROM comments AS c
      LEFT JOIN users_avatars AS a ON a.user_login = c.user_login
      LEFT JOIN users AS u ON u.login = c.user_login
      LEFT JOIN likes_on_comments AS l ON l.comment_id = c.id
      WHERE ${conditions[indexOfCondition]}
      GROUP BY id, avatar
      ORDER BY id ASC
    `,
    [id]
  );

  // создаем массив логинов пользователей, которые поставили лайк комментарию
  const comments = commentArrayFromDB[0].map(el => {
    // также выстраиваем путь к папке аватарок
    if (el.avatar) {
      el.avatar = avatarsFolderUrl + el.avatar;
    }
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

  return comments;
}
