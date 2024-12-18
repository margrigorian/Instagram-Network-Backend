import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getUser, getUserSubscriptions } from "./users.js";
import { getPosts } from "./posts.js";
import { IAccount } from "../types/accountsSliceTypes.js";

export async function getAccountInfo(login: string): Promise<IAccount | null> {
  const user = await getUser(login);

  // чтобы исключить лишние действия
  if (user) {
    // удаляем, не стоит отправлять id на frontend
    delete user.id;
    delete user.password;

    // запрашиваем подписки
    const subscriptions = await getUserSubscriptions(user.login);
    // запрашиваем посты
    const posts = await getPosts("login", login);

    return {
      user,
      followers: subscriptions.followers,
      following: subscriptions.following,
      posts
    };
  }

  return null;
}
