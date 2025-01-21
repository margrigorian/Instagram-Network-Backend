import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IComment, ISearchComment, IUserLikeOnComment } from "../types/commentsSliceTypes.js";

const avatarsFolderUrl: string = "http://localhost:3001/users_avatars/";

export async function getComments(post_id: string): Promise<IComment[]> {
  const commentArrayFromDB: IComment[] = await getCommentsWithUsersAndLikesInfo(0, post_id);

  const commentArrayPromises: Promise<IComment>[] = commentArrayFromDB.map(async el => {
    const subcomments: IComment[] = await getCommentsWithUsersAndLikesInfo(1, el.id);
    el.subcomments = subcomments;
    return el;
  });
  const comments: IComment[] = await Promise.all(commentArrayPromises).then(resuilt => resuilt);

  return comments;
}

async function getCommentsWithUsersAndLikesInfo(indexOfCondition: number, id: string | number): Promise<IComment[]> {
  // первые два условия возвращают массив, тратье - конкретный комментарий
  const conditions: string[] = [`c.post_id = ? AND under_comment IS NULL`, "under_comment = ?", "c.id = ?"];
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

// для внутренних проверок, быстрого поиска
export async function getComment(comment_id: number): Promise<ISearchComment | null> {
  const comment: [(RowDataPacket & ISearchComment)[], FieldPacket[]] = await db.query(
    `SELECT c.id as id, c.post_id as post_id, c.user_login as user_login FROM comments as c WHERE id = ?`,
    [comment_id]
  );

  if (comment[0].length > 0) {
    return comment[0][0];
  }

  return null;
}

export async function postComment(
  content: string,
  hashtags: string,
  user_links: string,
  under_comment: number | null,
  post_id: string,
  login: string
): Promise<IComment> {
  const lastCommentId = await getLastCommentId();

  // напрямую передаем параметры, так как почти вся информация проверена
  await db.query(
    `
      INSERT INTO comments(id, content, hashtags, user_links, under_comment, post_id, user_login)
      VALUES("${lastCommentId + 1}", "${content}", "${hashtags}", "${user_links}", ${under_comment ? `"${under_comment}"` : "NULL"}, ?, "${login}")
    `,
    [post_id]
  );

  const comment = await getCommentsWithUsersAndLikesInfo(2, lastCommentId + 1);
  // если это самостоятельный комментарий, добавляем subcomments
  if (under_comment === null) {
    comment[0].subcomments = [];
  }

  return comment[0];
}

export async function deleteComment(comment_id: number): Promise<IComment> {
  const deletedСomment = await getCommentsWithUsersAndLikesInfo(2, comment_id);
  await db.query(`DELETE FROM comments WHERE id = "${comment_id}"`);
  return deletedСomment[0];
}

async function getLastCommentId(): Promise<number> {
  const lastId: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query(
    `
      SELECT id FROM comments ORDER BY id DESC LIMIT 1
    `
  );

  if (lastId[0][0]) {
    return lastId[0][0].id;
  }

  return 0; // записей еще нет
}

export async function getUserLikeOnComment(comment_id: number, login: string): Promise<IUserLikeOnComment | null> {
  const like: [(RowDataPacket & IUserLikeOnComment)[], FieldPacket[]] = await db.query(
    `SELECT * FROM likes_on_comments WHERE comment_id = ? AND user_login = "${login}"`,
    [comment_id]
  );

  if (like[0][0]) {
    return like[0][0];
  }

  return null;
}

export async function addLikeToComment(comment_id: number, login: string): Promise<IUserLikeOnComment | null> {
  await db.query(`INSERT INTO likes_on_comments(comment_id, user_login) VALUE("${comment_id}", "${login}")`);
  return getUserLikeOnComment(comment_id, login);
}

export async function deleteUserLikeOnComment(liked_comment_id: number, login: string): Promise<void> {
  await db.query(
    `
      DELETE FROM likes_on_comments WHERE comment_id = "${liked_comment_id}" AND user_login = "${login}"
    `
  );
}
