import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { getAvatar, putAvatar, updateUserInfo } from "../db/slices/users.js";

export async function putUserAvatarAndUserInfoController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { user, about, gender, recommendation } = req.body;
    let image = req.file?.path || "";

    // если отправлен файл, значит запрос на обновление аватарки
    if (image) {
      const avatar = await getAvatar(user.login);

      // если аватарка есть в базе данных, обновляем
      if (avatar) {
        image = image.slice(14);
        const updatedAvatar = await putAvatar(user.login, image);

        response.data = {
          data: updatedAvatar
        };
        return res.status(201).json(response);
      }
    } else {
      // в противном случае осуществляется запрос на обновление данных юзера
      const updatdeUserInfo = await updateUserInfo(user.login, about, gender, recommendation);
      response.data = {
        data: updatdeUserInfo
      };
      return res.status(201).json(response);
    }

    // аватарку обновить невозможно, ее нет
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
