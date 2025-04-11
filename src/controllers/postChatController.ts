import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { getDialog, createChat, clearValueOfDeletedFromColumnInChat } from "../db/slices/chats.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function postChatController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const participants: string[] = req.body.participants;
    const response = getResponseTemplate();
    const message = "400 Bad Request";

    // действительны ли переданные участники
    const isExistingParticipants = await Promise.all(
      participants.map(async el => {
        const participant = await checkLogin(el);
        return participant.login !== null;
      })
    );

    // при наличии одного хоть несуществующего участника будет направлена ошибка
    const nonExistendParticipant = isExistingParticipants.some(el => el === false);

    if (nonExistendParticipant) {
      response.error = { message };
      return res.status(400).json(response);
    }

    // существует ли уже диалог
    if (participants.length === 1) {
      const dialog = await getDialog(user.login, participants[0]);
      if (dialog) {
        // диалог существует и ни у кого из собеседников ранее не был удален
        // или же отправлен запрос на создание диалога пользователем, который не уделял его
        // в это случае запрос ошибочный, он не может быть направлен с фронтенда
        if (dialog.deleted_from === null && dialog.deleted_from !== user.login) {
          response.error = { message };
          return res.status(400).json(response);
        } else {
          // пользователь ранее удалял диалог, возвращаем существующий
          // но предде аннулируем deleted_from в чате
          await clearValueOfDeletedFromColumnInChat(dialog.id);
          // нет смысла делать лишний запрос с обновленным полем deleted_from
          dialog.deleted_from = null;
          response.data = {
            data: dialog
          };
          return res.status(200).json(response);
        }
      }
    }

    const chat = await createChat(user.login, participants);

    response.data = {
      data: chat
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
