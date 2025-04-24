import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { IMessage, IInfoAboutUnreadMessageByUser } from "../types/chatsAndMessagesSliceTypes.js";
import { IListedAccount } from "../types/accountsSliceTypes.js";

export async function getMessages(chat_id: number, user_login: string, participants: IListedAccount[], condition: string = ""): Promise<IMessage[]> {
  const limit = condition ? "LIMIT 1" : "";
  const messages: [(RowDataPacket & IMessage)[], FieldPacket[]] = await db.query(
    `
        SELECT m.id AS id, m.message AS message, m.sender AS sender, m.time AS time, m.chat_id AS chat_id,
        IF(u.message_id IS NULL, 1, 0) AS is_read FROM messages AS m
        LEFT JOIN unread_messages AS u ON m.id = u.message_id AND u.user_login = "${user_login}" AND m.chat_id = u.chat_id 
        WHERE m.chat_id = "${chat_id}" AND (m.deleted_from IS NULL OR m.deleted_from != "${user_login}")
        ${condition ? "ORDER BY m.id  DESC" : "ORDER BY m.id ASC"}
        ${limit}
    `
  );

  // редактируем is_read и находим, добавляем к сообщению полную информацию об отправителе
  messages[0] = messages[0].map(el => {
    el.is_read = Boolean(el.is_read);
    const senderInfo = participants.find(contact => contact.login === el.sender);
    // для верной типизации
    if (senderInfo) {
      el.sender = senderInfo;
    }
    return el;
  });

  return messages[0];
}

export async function getMessageById(message_id: number, chat_id: number): Promise<IMessage> {
  const message: [(RowDataPacket & IMessage)[], FieldPacket[]] = await db.query(
    `
        SELECT * FROM messages WHERE id = ? AND chat_id = ? 
    `,
    [message_id, chat_id]
  );

  return message[0][0];
}

export async function getLastMessageId(chat_id: number): Promise<number> {
  const result: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query(
    `
          SELECT id FROM messages WHERE chat_id = "${chat_id}" ORDER BY id DESC LIMIT 1
      `
  );

  const lastMessageId = result[0][0];
  if (lastMessageId) {
    return lastMessageId.id;
  }
  return 0;
}

export async function postMessage(
  message_id: number,
  message: string,
  user_login: string,
  message_time: number,
  chat_id: number,
  participants: IListedAccount[]
): Promise<IMessage> {
  await db.query(
    `
        INSERT INTO messages(id, message, sender, time, chat_id) VALUES(?, ?, ? ,?, ?) 
    `,
    [message_id, message, user_login, message_time, chat_id]
  );

  const expression: string[] = [];
  const params: (string | number)[] = [];

  participants.forEach(async (el, i) => {
    if (el.login !== user_login) {
      expression.push("(?, ?, ?)");
      params.push(message_id);
      params.push(chat_id);
      params.push(el.login);
    }
  });

  await db.query(
    `
        INSERT INTO unread_messages(message_id, chat_id, user_login) VALUES ${expression.join(",")}
    `,
    params
  );

  // запрашиваем последнее добавленное сообщение
  const messages = await getMessages(chat_id, user_login, participants, "lastMessage");
  return messages[0];
}

export async function getInfoAboutUnreadMessageByUser(
  message_id: number,
  chat_id: number,
  user_login: string
): Promise<IInfoAboutUnreadMessageByUser> {
  const messageUnreadStatus: [(RowDataPacket & IInfoAboutUnreadMessageByUser)[], FieldPacket[]] = await db.query(
    `
        SELECT * FROM unread_messages WHERE message_id = ? AND chat_id = ? AND user_login = ?
    `,
    [message_id, chat_id, user_login]
  );

  return messageUnreadStatus[0][0];
}

export async function deleteInfoAboutMessageAsUnreadByUser(message_id: number, chat_id: number, user_login: string): Promise<void> {
  await db.query(
    `
        DELETE FROM unread_messages WHERE message_id = ? AND chat_id = ? AND user_login = ?
    `,
    [message_id, chat_id, user_login]
  );
}

export async function deleteMessage(message_id: number, chat_id: number): Promise<void> {
  await db.query(
    `
            DELETE FROM messages WHERE id = ? AND chat_id = ?
        `,
    [message_id, chat_id]
  );
}
