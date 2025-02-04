import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { checkUser, getToken } from "../servicing/authService.js";
import { getUserSubscriptions } from "../db/slices/users.js";

export async function userLoginController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { login, password } = req.body;
    const user = await checkUser(login, password);

    if (user) {
      // авторизация прошла успешно, выдаем токен
      const token = getToken(user.login);
      // удаляем, не стоит отправлять id на frontend
      delete user.id;
      // запрашиваем подписки
      const subscriptions = await getUserSubscriptions(user.login);

      response.data = {
        data: {
          user,
          followers: subscriptions.followers,
          following: subscriptions.followings,
          token
        }
      };
      return res.status(201).json(response);
    }

    // даже если логина не существует, инстаграм выдает такой ответ
    message = "The user's password is invalid";
    response.error = {
      message
    };
    return res.status(406).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
