import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getUser } from "./users.js";
import { getPosts } from "./posts.js";
import { IAccount } from "../types/accountsSliceTypes.js";

export async function getAccountInfo(login: string): Promise<IAccount | null> {
  const user = await getUser(login);

  // чтобы исключить лишние действия
  if (user) {
    // удаляем, не стоит отправлять id на frontend
    delete user.id;
    delete user.password;

    const followers: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
      `SELECT login_of_follower AS id FROM subscriptions WHERE login_of_following = "${login}"`
    );

    const following: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
      `SELECT login_of_following AS login FROM subscriptions WHERE login_of_follower = "${login}"`
    );

    const posts = await getPosts("login", login);

    return {
      user,
      followers: followers[0],
      following: following[0],
      posts
    };
  }

  return null;
}
