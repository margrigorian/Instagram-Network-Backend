import { Request, Response } from "express";
import { checkLogin, getUserSubscriptions } from "../db/slices/users.js";
import { addNewUser, getToken } from "../servicing/authService.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function userRegistrationController(req: Request, res: Response<IResponse>) {
  try {
    let message: string;
    const response = getResponseTemplate();

    const { login, username, contact, password } = req.body;
    const checkedLogin = await checkLogin(login);

    if (checkedLogin.login === null) {
      // логин не занят, регистрируем пользователя
      const user = await addNewUser(login, username, contact, password);
      let token;

      // проверка требуется типизацией
      if (user) {
        token = getToken(user.login);
        // удаляем, не стоит отправлять id на frontend
        delete user.id;
        // запрашиваем подписки
        const subscriptions = await getUserSubscriptions(user.login);

        // после регистрации сразу произойдет переход на home page
        response.data = {
          data: {
            user,
            followers: subscriptions.followers,
            followings: subscriptions.followings,
            token
          }
        };
        return res.status(201).json(response);
      }
    }

    message = "User login already exists";
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
