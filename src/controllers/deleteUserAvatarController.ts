import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { getAvatar, deleteAvatar } from "../db/slices/users.js";
import { deleteUserAvatar } from "../servicing/userService.js";

export async function deleteUserAvatarController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { user } = req.body;
    const avatar = await getAvatar(user.login);

    if (avatar) {
      // если аватара есть в базе данных, удаляем
      // await deleteAvatar(user.login);
      await deleteUserAvatar(user.login, avatar.image);

      response.data = {
        data: avatar
      };
      return res.status(200).json(response);
    }

    // аватарку удалить невозможно, ее нет
    message = "400 Bad Request";
    response.error = {
      message
    };
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
