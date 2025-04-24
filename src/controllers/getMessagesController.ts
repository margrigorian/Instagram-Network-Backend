import { Request, Response } from "express";
import { getInbox, getChatById } from "../db/slices/chats.js";
import { getMessages } from "../db/slices/messages.js";
import { getSearchAccounts } from "../db/slices/accounts.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import { IChat, IMessage } from "../db/types/chatsAndMessagesSliceTypes.js";
import { IListedAccount } from "../db/types/accountsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function getMessagesController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const chatId = req.params.id;
    const { inbox, search } = req.query;
    let chats: IChat[] = [];
    let currentChatMessages: IMessage[] = [];
    let searchAccounts: IListedAccount[] = [];
    const response = getResponseTemplate();

    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      searchAccounts = await getSearchAccounts(search);
    } else {
      // сработает при перезагрузе страницы чата на фронтенде
      // в противном случае повторный запрос inbox ни к чему, он имеется там
      if (!inbox || inbox === "true") {
        chats = await getInbox(user.login);
      }

      const chat = await getChatById(Number(chatId));
      // если чата с указанным id не существует или же пользователь не является участником чата,
      // направляем ошибку
      if (!chat || !chat.participants?.find(el => el.login === user.login)) {
        const message = "400 Bad Request";
        response.error = { message };
        return res.status(400).json(response);
      }

      currentChatMessages = await getMessages(Number(chatId), user.login, chat.participants);
    }

    response.data = {
      data: {
        chats,
        currentChatMessages,
        searchAccounts
      }
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
