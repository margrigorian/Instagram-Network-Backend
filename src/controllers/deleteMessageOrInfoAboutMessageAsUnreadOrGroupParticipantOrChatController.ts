import { Request, Response } from "express";
import { getChatById, deleteGroupParticipant, markChatAsDeletedByUser, deleteChat } from "../db/slices/chats.js";
import { getMessageById, getInfoAboutUnreadMessageByUser, deleteInfoAboutMessageAsUnreadByUser, deleteMessage } from "../db/slices/messages.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function deleteMessageOrInfoAboutMessageAsUnreadOrGroupParticipantOrChatController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const chatId = req.params.id;
    const { readMessageId, messageId, participant } = req.query;
    const response = getResponseTemplate();
    const badRequestError = "400 Bad Request";
    const accessError = "403 Forbidden"; // прав на действие нет

    const chat = await getChatById(Number(chatId));
    // чат с указанным id существует и пользователь является его участником чата
    if (chat && chat.participants?.find(el => el.login === user.login)) {
      let id: number;
      // если действия связаны с сообщением, проверяем его наличие
      if (readMessageId || messageId) {
        id = Number(readMessageId) || Number(messageId);
        const message = await getMessageById(id, Number(chatId));
        // сообщение с таким id присутствует, соответственно оно может быть считано или удалено
        if (message) {
          if (readMessageId) {
            // удаление сообщения из непрочитанных
            const infoAboutUnreadMessageByUser = await getInfoAboutUnreadMessageByUser(id, Number(chatId), user.login);
            if (infoAboutUnreadMessageByUser) {
              await deleteInfoAboutMessageAsUnreadByUser(id, Number(chatId), user.login);
              response.data = {
                data: infoAboutUnreadMessageByUser
              };
              return res.status(200).json(response);
            }
          } else {
            // удаление самого сообщения
            if (message.sender === user.login || (chat.type === "group" && chat.creators === user.login)) {
              await deleteMessage(id, Number(chatId));
              // поле deleted_from необходимо для внутренних задач
              delete message.deleted_from;
              response.data = {
                data: message
              };
              return res.status(200).json(response);
            } else {
              response.error = { message: accessError };
              return res.status(403).json(response);
            }
          }
        }
      } else if (participant) {
        if (chat.type === "group") {
          const isGroupPartisipant = chat.participants.find(el => el.login === participant);
          // является участником группы
          if (isGroupPartisipant) {
            // или сам участник хочет выйти из группового чата или же создатель группы удаляет его
            if (user.login === participant || chat.creators === user.login) {
              if (typeof participant === "string") {
                await deleteGroupParticipant(chat.id, participant);
              }
              response.data = {
                data: {
                  chat_id: chat.id,
                  participant
                }
              };
              return res.status(200).json(response);
            } else {
              // при несоответствии - ошибка доступа
              response.error = { message: accessError };
              return res.status(403).json(response);
            }
          }
        }
      } else {
        // удаление диалога
        if (chat.type === "dialog") {
          // удаление диалога ранее со стороны собеседников не осуществлялось
          if (chat.deleted_from === null) {
            await markChatAsDeletedByUser(chat.id, user.login);
            chat.deleted_from = user.login;
            response.data = { data: chat };
            return res.status(200).json(response);
          } else if (chat.deleted_from !== user.login) {
            // повторно у одного и того же пользователя диалог не может быть удален
            // поэтому необходима проверка chat.deleted_from !== user.login
            await deleteChat(chat.id);
            // диалог ранее удалялся собеседником
            // при удалении и со стороны пользователя диалог будет удален полностью
            delete chat.deleted_from;
            response.data = { data: chat };
            return res.status(200).json(response);
          }
        } else {
          // удаление группы
          if (chat.creators === user.login) {
            await deleteChat(chat.id);
            delete chat.deleted_from;
            response.data = { data: chat };
            return res.status(200).json(response);
          } else {
            response.error = { message: accessError };
            return res.status(403).json(response);
          }
        }
      }
    }

    // при любом несответствии выше будет направлена ошибка badRequestError
    response.error = { message: badRequestError };
    return res.status(400).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
