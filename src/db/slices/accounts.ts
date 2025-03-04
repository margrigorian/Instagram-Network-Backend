import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getUser, getUserSubscriptions } from "./users.js";
import { getPosts } from "./posts.js";
import { IAccount, ISearchAccount, ISubsciption } from "../types/accountsSliceTypes.js";

const url: string = "http://localhost:3001/users_avatars/";

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
      followers_count: subscriptions.followers.length,
      followings_count: subscriptions.followings.length,
      posts
    };
  }

  return null;
}

export async function getFollowers(user_login: string, account_login: string, search: string): Promise<ISearchAccount[]> {
  const followersInfoArr: [(RowDataPacket & ISearchAccount)[], FieldPacket[]] = await db.query(
    `
      SELECT DISTINCT s.login_of_follower AS login, u.username AS username, a.image AS avatar,
      u.verification AS verification FROM subscriptions AS s
      LEFT JOIN users AS u ON  s.login_of_follower = u.login
      LEFT JOIN users_avatars AS a ON  s.login_of_follower = a.user_login
      WHERE s.login_of_following = "${account_login}" AND (u.login LIKE ? OR u.username LIKE ?)
      ORDER BY s.login_of_follower = "${user_login}" DESC
    `,
    [`%${search}%`, `%${search}%`]
  );

  const followersPromises: Promise<RowDataPacket & ISearchAccount>[] = followersInfoArr[0].map(async el => {
    // формируем путь к файлу изображения
    if (el.avatar) el.avatar = url + el.avatar;
    // чтобы в объекте самого себя (user) не было свойства follow_account
    // это будет отличительной чертой
    if (el.login !== user_login) {
      const subscription = await getSubscription(user_login, el.login);
      subscription ? (el.follow_account = true) : (el.follow_account = false);
    }
    return el;
  });

  const followers = await Promise.all(followersPromises);
  return followers;
}

export async function getFollowings(user_login: string, account_login: string, search: string): Promise<ISearchAccount[]> {
  const followingsInfoArr: [(RowDataPacket & ISearchAccount)[], FieldPacket[]] = await db.query(
    `
      SELECT DISTINCT s.login_of_following AS login, u.username AS username, a.image AS avatar, 
      u.verification AS verification FROM subscriptions AS s
      LEFT JOIN users AS u ON s.login_of_following = u.login
      LEFT JOIN users_avatars AS a ON s.login_of_following = a.user_login
      WHERE s.login_of_follower = "${account_login}" AND (u.login LIKE ? OR u.username LIKE ?)
      ORDER BY s.login_of_following = "${user_login}" DESC
    `,
    [`%${search}%`, `%${search}%`]
  );

  const followingsPromises: Promise<RowDataPacket & ISearchAccount>[] = followingsInfoArr[0].map(async el => {
    // формируем путь к файлу изображения
    if (el.avatar) el.avatar = url + el.avatar;
    // если это followings другого пользователя, проводим проверку подписаны ли и мы на них
    if (user_login !== account_login) {
      // чтобы в объекте самого себя (user) не было свойства follow_account
      // это будет отличительной чертой
      if (el.login !== user_login) {
        const subscription = await getSubscription(user_login, el.login);
        subscription ? (el.follow_account = true) : (el.follow_account = false);
      }
    } else {
      // в противном случае это все наши followings
      el.follow_account = true;
    }
    return el;
  });

  const followings = await Promise.all(followingsPromises);
  return followings;
}

export async function getSubscription(login_of_follower: string, login_of_following: string): Promise<ISubsciption | null> {
  const subscription: [(RowDataPacket & ISubsciption)[], FieldPacket[]] = await db.query(
    `
      SELECT * FROM subscriptions WHERE login_of_follower = "${login_of_follower}" 
      AND login_of_following = "${login_of_following}"
    `
  );

  if (subscription[0][0]) {
    return subscription[0][0];
  }

  return null;
}

export async function postSubscription(login_of_follower: string, login_of_following: string): Promise<ISubsciption | null> {
  await db.query(
    `
      INSERT INTO subscriptions(login_of_follower, login_of_following) 
      VALUES("${login_of_follower}","${login_of_following}")
    `
  );

  return getSubscription(login_of_follower, login_of_following);
}

export async function deleteSubscription(login_of_follower: string, login_of_following: string): Promise<void> {
  await db.query(
    `
        DELETE FROM subscriptions WHERE login_of_follower = "${login_of_follower}" 
        AND login_of_following = "${login_of_following}"
      `
  );
}

export async function searchAccounts(search: string): Promise<ISearchAccount[]> {
  const accounts: [(RowDataPacket & ISearchAccount)[], FieldPacket[]] = await db.query(
    `
      SELECT u.login AS login, u.username AS username, a.image AS avatar, 
      u.verification AS verification FROM users AS u
      LEFT JOIN users_avatars AS a ON u.login = a.user_login
      WHERE u.login LIKE ? OR u.username LIKE ?
      LIMIT 5
    `,
    [`%${search}%`, `%${search}%`]
  );

  accounts[0].map(el => {
    if (el.avatar) el.avatar = url + el.avatar;
  });

  return accounts[0];
}
