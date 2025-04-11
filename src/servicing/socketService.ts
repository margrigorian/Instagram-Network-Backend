import { getSocket, addSocket, updateSocket, deleteSocket } from "../db/slices/socket.js";
import { IListedAccount } from "../db/types/accountsSliceTypes.js";

export async function getChatParticipantsSockets(participants: IListedAccount[]) {
  // отфильтровываем null-значения для соответствия типизации
  const sockets = (await Promise.all(participants.map(async el => await getSocket(el.login)))).filter(el => el !== null);
  return sockets;
}

export async function addSocketToDB(login: string, socketId: string) {
  try {
    const socket = await getSocket(login);

    if (!socket) {
      await addSocket(login, socketId);
      console.log(`Socket with login ${login} has added`);
    } else {
      await updateSocket(login, socketId);
      console.log(`Socket with login ${login} has updated`);
    }
  } catch (err) {
    console.error("Error adding or updating socket:", err);
  }
}

export async function deleteSocketFromDB(socketId: string) {
  try {
    // проверять наличие сокета не имеет смысл, раз соединение ранее было установлено
    // сокет точно присутствует в БД
    await deleteSocket(socketId);
    console.log(`Socket with id ${socketId} has deleted`);
  } catch (err) {
    console.error("Error deleting socket:", err);
  }
}
