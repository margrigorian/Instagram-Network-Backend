import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getUser, getUserSubscriptions } from "./users.js";
import { getPosts } from "./posts.js";
import { IAccount, IRecommendedAccount, ISearchAccount, ISubsciption } from "../types/accountsSliceTypes.js";

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
    el.verification = Boolean(el.verification);

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
    el.verification = Boolean(el.verification);

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

export async function getRecommendedAccounts(login: string): Promise<IRecommendedAccount[]> {
  // подписки пользователя
  const subscriptions = await getUserSubscriptions(login);
  // для использования в условии IN
  const followings = subscriptions.followings.map(el => `"${el.login}"`);

  let recommendations: IRecommendedAccount[] = [];

  if (followings.length > 0) {
    // в качестве рекомендаций получаем аккаунты, на которые подписаны followings юзера
    const recommendedAccounts: [(RowDataPacket & IRecommendedAccount)[], FieldPacket[]] = await db.query(
      `
      SELECT s.login_of_following AS login, u.username AS username, a.image AS avatar, u.verification AS verification, 
      GROUP_CONCAT(s.login_of_follower SEPARATOR ', ') AS followers FROM subscriptions AS s
      LEFT JOIN users_avatars AS a ON a.user_login = s.login_of_following
      LEFT JOIN users AS u ON u.login = s.login_of_following
      WHERE s.login_of_follower IN (${followings.join(",")}) 
      AND s.login_of_following NOT IN ("${login}",${followings.join(",")})
      GROUP BY s.login_of_following, a.image
      LIMIT 6
    `
    );

    recommendedAccounts[0].map(el => {
      if (el.avatar) el.avatar = url + el.avatar;
      el.verification = Boolean(el.verification);
    });

    recommendations = [...recommendations, ...recommendedAccounts[0]];
  }

  // если рекомендуемых аккаунтов недостаточно, забираем популярных из списка users
  if (recommendations.length < 6) {
    // исключаем себя, свои подсписки и уже имеющиеся рекомендации
    let accountsFilter = "";

    if (followings.length > 0) {
      const existedRecommendations = recommendations.reduce((sum, currentItem) => sum + `,"${currentItem.login}"`, "");
      accountsFilter = `AND u.login NOT IN (${followings.join(",")}${existedRecommendations})`;
    }

    let accounts: [(RowDataPacket & IRecommendedAccount)[], FieldPacket[]] = await db.query(
      `
        SELECT u.login AS login, u.username AS username, a.image AS avatar, u.verification AS verification,
        COUNT(s.login_of_following) AS followers_count FROM users AS u
        LEFT JOIN users_avatars AS a ON a.user_login = u.login
        LEFT JOIN subscriptions AS s ON s.login_of_following = u.login
        WHERE u.login != "${login}" ${accountsFilter}
        GROUP BY u.login, u.username, a.image, u.verification 
        ORDER BY followers_count DESC
        LIMIT ${6 - recommendations.length}
      `
    );

    // добавляем свойство followers,
    // удаляем свойство followers_count, которое было необходимо для определения
    // популярных аккаунтов в качестве рекомендации
    accounts[0] = accounts[0].map(el => {
      if (el.avatar) el.avatar = url + el.avatar;
      el.verification = Boolean(el.verification);
      el.followers = "";
      delete el.followers_count;
      return el;
    });
    recommendations = [...recommendations, ...accounts[0]];
  }

  return recommendations;
}

export async function getSearchAccounts(search: string): Promise<ISearchAccount[]> {
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
    el.verification = Boolean(el.verification);
  });

  return accounts[0];
}
