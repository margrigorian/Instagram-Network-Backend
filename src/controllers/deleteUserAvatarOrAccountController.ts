import { Request, Response } from "express";
import { getAvatar, deleteUser } from "../db/slices/users.js";
import { deleteUserAvatar } from "../servicing/userService.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function deleteUserAvatarOrAccountController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { user } = req.body;
    const avatarParam = req.query.avatar;

    if (avatarParam) {
      const avatar = await getAvatar(user.login);
      if (avatar) {
        // если аватар есть в базе данных, удаляем
        await deleteUserAvatar(user.login, avatar.image);

        response.data = {
          data: avatar
        };
      } else {
        // аватарку удалить невозможно, ее нет
        message = "400 Bad Request";
        response.error = {
          message
        };
        return res.status(400).json(response);
      }
    } else {
      // удаление пользователя
      await deleteUser(user.login);
      delete user.id;
      delete user.password;
      response.data = {
        data: user
      };
    }

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
