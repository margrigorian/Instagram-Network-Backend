import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { getAvatar, postAvatar } from "../db/slices/users.js";

export async function postUserAvatarController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { user } = req.body;
    let image = req.file?.path || "";

    if (image) {
      image = image.slice(14);

      const avatar = await getAvatar(user.login);

      if (avatar === null) {
        // аватарки еще нет, добавляем
        const newAvatar = await postAvatar(user.login, image);

        response.data = {
          data: newAvatar
        };
        return res.status(201).json(response);
      }
    }

    // не было прикреплено изображение или же аватар уже существует, поэтому post-запрос некорректен
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
