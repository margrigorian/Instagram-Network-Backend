import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IUser, IAvatar, IUserSubscriptions } from "../types/usersSliceTypes.js";

const url: string = "http://localhost:3001/users_avatars/";

export async function checkLogin(login: string): Promise<{ login: string | null }> {
  const result: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
    `
      SELECT login FROM users WHERE login = ?
    `,
    [login]
  );
  const existingLogin = result[0][0]; // или же будет undefined, typescript не ругается

  if (existingLogin) {
    return existingLogin;
  } else {
    return {
      login: null // легче будет обрабатывать на front, нежели null сразу
    };
  }
}

export async function getUser(login: string): Promise<IUser | null> {
  // не включаем contact, чтобы не отображалось на front; password нужен для проверки
  // id может пригодиться, хотя на фронт он также не отправляется
  const result: [(RowDataPacket & IUser)[], FieldPacket[]] = await db.query(
    `
      SELECT u.id, u.login, u.username, u.password, a.image AS avatar, u.about, u.gender, u.verification, u.recommendation FROM users AS u
      LEFT JOIN users_avatars AS a ON a.user_login = u.login
      WHERE contact = ? OR login = ?
    `,
    [login, login] // по количеству знаков вопроса, выносим отдельно, в целям безопасности
  );

  const user = result[0][0];
  // verification - синяя галочка в инсте
  // recommendation - рекомендация аккаунтов других пользователей, можно настраивать

  if (user) {
    if (user.avatar) user.avatar = url + user.avatar;
    user.verification = Boolean(user.verification);
    user.recommendation = Boolean(user.recommendation);
    return user;
  }

  return null;
}

export async function getUserSubscriptions(login: string): Promise<IUserSubscriptions> {
  const followers: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
    `SELECT login_of_follower AS login FROM subscriptions WHERE login_of_following = "${login}"`
  ); // без "" выходит ошибка

  const followings: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(
    `SELECT login_of_following AS login FROM subscriptions WHERE login_of_follower = "${login}"`
  );

  return {
    followers: followers[0],
    followings: followings[0]
  };
}

export async function addUser(login: string, usernameParam: string | undefined, contact: string, password: string): Promise<IUser | null> {
  const lastId: number = await getLastUserId();

  let username: string | null;
  if (usernameParam) {
    username = usernameParam;
  } else {
    username = null;
  }

  await db.query(
    `
      INSERT INTO users(id, login, username, contact, password, about) VALUES(${lastId + 1}, "${login}", ?, ?, ?, "${""}")
    `,
    [username, contact, password]
  );

  return getUser(login);
}

export async function updateUserInfo(login: string, about: string, gender: string | null, recommendation: boolean): Promise<IUser | null> {
  let valueOfRecommendation: number;
  recommendation ? (valueOfRecommendation = 1) : (valueOfRecommendation = 0);

  await db.query(
    `
      UPDATE users SET about = ?, ${gender ? "gender = ?" : "gender = NULL"}, recommendation = "${valueOfRecommendation}"
      WHERE login = "${login}"
    `,
    [about, gender]
  );

  const user = await getUser(login);
  delete user?.id;
  delete user?.password;
  // отправляем обновленную информацию
  return user;
}

async function getLastUserId(): Promise<number> {
  const result: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1");

  const lastUserIdObj = result[0][0];

  if (lastUserIdObj) {
    return lastUserIdObj.id;
  }

  return 0;
}

export async function getAvatar(login: string): Promise<IAvatar | null> {
  const avatarInfo: [(RowDataPacket & IAvatar)[], FieldPacket[]] = await db.query(`SELECT * FROM users_avatars WHERE user_login = "${login}"`);

  if (avatarInfo[0][0]) {
    const avatar = avatarInfo[0][0];
    avatar.image = url + avatar.image;
    return avatar;
  }

  return null;
}

export async function postAvatar(login: string, image: string): Promise<IAvatar | null> {
  await db.query(`INSERT INTO users_avatars(user_login, image) VALUES("${login}", "${image}")`);
  return getAvatar(login);
}

export async function putAvatar(login: string, image: string): Promise<IAvatar | null> {
  await db.query(`UPDATE users_avatars SET image = "${image}" WHERE user_login = "${login}"`);
  return getAvatar(login);
}

export async function deleteAvatar(login: string): Promise<void> {
  await db.query(`DELETE FROM users_avatars WHERE user_login = "${login}"`);
}
