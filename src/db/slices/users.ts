import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";

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
