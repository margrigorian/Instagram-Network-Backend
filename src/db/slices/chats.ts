import db from "../db.js";
import { FieldPacket, RowDataPacket } from "mysql2/promise";
import { getMessages } from "./messages.js";
import { IListedAccount } from "../types/accountsSliceTypes.js";
import { IChat } from "../types/chatsAndMessagesSliceTypes.js";

const avatarsFolderUrl: string = "http://localhost:3001/users_avatars/";

export async function getInbox(login: string): Promise<IChat[]> {
  const chats: [(RowDataPacket & IChat)[], FieldPacket[]] = await db.query(
    `
      SELECT c.* FROM chats AS c
      LEFT JOIN chat_participants AS p ON p.chat_id = c.id
      WHERE p.user_login = "${login}" AND (c.deleted_from IS NULL OR c.deleted_from != "${login}")
    `
  );

  if (chats[0].length > 0) {
    const promiseOfChatsWithParticipantsAndLastMessage: Promise<IChat>[] = chats[0].map(async el => {
      const participants = await getChatParticipants(el.id);
      el.participants = participants;

      // по типизации приходится получать массив сообщений
      const messages = await getMessages(el.id, login, participants, "lastMessage");
      el.last_message = messages[0];
      return el;
    });

    let chatsWithParticipantsAndLastMessage = await Promise.all(promiseOfChatsWithParticipantsAndLastMessage);
    // сортировка чатов по новым непрочитанным сообщениям и времени их отправки
    chatsWithParticipantsAndLastMessage = chatsWithParticipantsAndLastMessage.sort((a, b) => {
      // если last_message отсутствует, перемещаем "ниже"
      if (!a.last_message || !b.last_message) {
        // порядок не изменится
        return -1;
      } else {
        // если значения is_read одинаковы, сортируем по времени отправки сообщения
        if (a.last_message.is_read === b.last_message.is_read) {
          return b.last_message.time - a.last_message.time;
        }

        return a.last_message.is_read ? 1 : -1;
      }
    });

    return chatsWithParticipantsAndLastMessage;
  }

  return [];
}

export async function getChatById(id: number): Promise<IChat | null> {
  const chat: [(RowDataPacket & IChat)[], FieldPacket[]] = await db.query(
    `
      SELECT * FROM chats WHERE id = "${id}"
    `
  );

  if (chat[0][0]) {
    // получаем контакты вместе с изображениями, верификацией
    const chatParticipants = await getChatParticipants(chat[0][0].id);
    chat[0][0].participants = chatParticipants;
    return chat[0][0];
  }

  return null;
}

export async function getDialog(user_login: string, participant: string): Promise<IChat | null> {
  const dialog: [(RowDataPacket & IChat)[], FieldPacket[]] = await db.query(
    `
      SELECT * FROM chats AS c
      WHERE c.creators = "${user_login}, ${participant}" OR c.creators = "${participant}, ${user_login}"
    `
  );

  if (dialog[0][0]) {
    const participants = await getChatParticipants(dialog[0][0].id);
    dialog[0][0].participants = participants;
    return dialog[0][0];
  }

  return null;
}

async function getChatParticipants(chat_id: number): Promise<IListedAccount[]> {
  const participants: [(RowDataPacket & IListedAccount)[], FieldPacket[]] = await db.query(
    `
      SELECT p.user_login AS login, u.username AS username, a.image AS avatar, 
      u.verification AS verification FROM chat_participants AS p
      LEFT JOIN users_avatars AS a ON p.user_login = a.user_login
      LEFT JOIN users AS u ON p.user_login = u.login
      WHERE p.chat_id = "${chat_id}" 
    `
  );

  participants[0].map(el => {
    // verification = null будет в случае, если пользователь удален
    if (el.verification !== null) {
      if (el.avatar) {
        el.avatar = avatarsFolderUrl + el.avatar;
      }
    } else {
      // помечаем контакт как удаленный
      el.deleted = true;
    }
    el.verification = Boolean(el.verification);
    return el;
  });

  return participants[0];
}

export async function createChat(user_login: string, participants: string[]): Promise<IChat | null> {
  const lastId: number = await getLastChatId();
  const params: string[] = [];
  if (participants.length === 1) {
    params.push("dialog", `${user_login}, ${participants[0]}`);
  } else {
    params.push("group", user_login);
  }

  await db.query(`INSERT INTO chats(id, type, creators) VALUES(${lastId + 1}, ?, ?)`, params);
  await addParticipantsToChat(lastId + 1, [...participants, user_login]);
  // возвращаем созданный чат
  const chat = await getChatById(lastId + 1);
  return chat;
}

async function addParticipantsToChat(chat_id: number, participants: string[]): Promise<void> {
  const expression: string[] = [];
  const params: (string | number)[] = [];

  participants.map(el => {
    expression.push("(?, ?)");
    params.push(chat_id, el);
  });

  await db.query(
    `
      INSERT INTO chat_participants(chat_id, user_login) VALUES ${expression.join(",")}
    `,
    params
  );
}

export async function deleteGroupParticipant(chat_id: number, user_login: string): Promise<void> {
  await db.query(`DELETE FROM chat_participants WHERE chat_id = ? AND user_login = ?`, [chat_id, user_login]);
}

async function getLastChatId(): Promise<number> {
  const result: [(RowDataPacket & { id: number })[], FieldPacket[]] = await db.query(
    `
      SELECT id FROM chats ORDER BY id DESC LIMIT 1
    `
  );

  const lastChatId = result[0][0];
  if (lastChatId) {
    return lastChatId.id;
  }
  return 0;
}

export async function clearValueOfDeletedFromColumnInChat(chat_id: number): Promise<void> {
  await db.query(`UPDATE chats SET deleted_from = NULL WHERE id = "${chat_id}"`);
}

export async function markDialogAsDeletedByUser(chat_id: number, user_login: string): Promise<void> {
  await db.query(`UPDATE chats SET deleted_from = ? WHERE id = ?`, [user_login, chat_id]);
}

export async function deleteChat(id: number): Promise<void> {
  await db.query(`DELETE FROM chats WHERE id = "${id}"`);
}
