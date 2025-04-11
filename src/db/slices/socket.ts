import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { ISocket } from "../types/socketSliceTypes.js";

export async function getSocket(login: string): Promise<ISocket | null> {
  // указываем socket_id AS socketId, обеспечивая соответствие IChat interface
  const socket: [(RowDataPacket & ISocket)[], FieldPacket[]] = await db.query(
    `
        SELECT * FROM sockets WHERE login = ?
    `,
    [login]
  );

  if (socket[0][0]) {
    return socket[0][0];
  }

  return null;
}

export async function addSocket(login: string, socketId: string): Promise<void> {
  await db.query(`INSERT INTO sockets(login, socket_id) VALUES(?, ?)`, [login, socketId]);
}

export async function updateSocket(login: string, socketId: string): Promise<void> {
  await db.query(`UPDATE sockets SET socket_id = ? WHERE login = ?`, [socketId, login]);
}

export async function deleteSocket(socketId: string): Promise<void> {
  await db.query(`DELETE FROM sockets WHERE socket_id = ? `, [socketId]);
}
