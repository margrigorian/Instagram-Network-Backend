import { Request, Response } from "express";
import { getChatById, clearValueOfDeletedFromColumnInChat } from "../db/slices/chats.js";
import { getLastMessageId, postMessage } from "../db/slices/messages.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function postMessageController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const chatId = req.params.id;
    const { message, time } = req.body;
    const response = getResponseTemplate();
    const errorMessage = "400 Bad Request";

    const chat = await getChatById(Number(chatId));
    // если чата с указанным id не существует или же пользователь не является участником чата,
    // направляем ошибку
    if (!chat || !chat.participants?.find(el => el.login === user.login)) {
      response.error = { message: errorMessage };
      return res.status(400).json(response);
    }

    // проверка, был ли у одного из собеседников удален диалог
    if (chat.deleted_from !== null) {
      // если да, "восстанавливаем" его, аннулируя deleted_from в чате
      await clearValueOfDeletedFromColumnInChat(chat.id);
    }
    const postedMessage = await postMessage(message, user.login, time, Number(chatId), chat.participants);
    response.data = {
      data: postedMessage
    };
    return res.status(200).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
