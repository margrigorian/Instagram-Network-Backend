import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IUser } from "../types/usersSliceTypes.js";

export async function checkLogin(login: string): Promise<{ login: string | null }> {
  const result: [(RowDataPacket & { login: string })[], FieldPacket[]] = await db.query(`SELECT login FROM users WHERE login = "${login}"`);
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
  const result: [(RowDataPacket & IUser)[], FieldPacket[]] = await db.query(
    `SELECT id, login, username, password, avatar, about, gender, verification, recommendation FROM users WHERE contact = "${login}" OR login = "${login}"`
  ); // без "" не работает

  const user = result[0][0];
  // verification - синяя галочка в инсте
  // recommendation - рекомендация аккаунтов других пользователей, можно настраивать

  if (user) {
    user.verification = Boolean(user.verification);
    user.recommendation = Boolean(user.recommendation);
    return user;
  }

  return null;
}

export async function addUser(contact: string, login: string, usernameParam: string | undefined, password: string) {
  const lastId: number = await getLastUserId();

  let username: string | null;
  if (usernameParam) {
    username = usernameParam;
  } else {
    username = null;
  }

  await db.query(`INSERT INTO users(id, contact, login, username, password) VALUES(${lastId + 1}, "${contact}", "${login}", ?, "${password}")`, [
    username
  ]);

  return getUser(login);
}

async function getLastUserId(): Promise<number> {
  const result: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query("SELECT id FROM users ORDER BY id DESC LIMIT 1");

  const lastUserIdObj = result[0][0];

  if (lastUserIdObj) {
    return lastUserIdObj.id;
  }

  return 0;
}
