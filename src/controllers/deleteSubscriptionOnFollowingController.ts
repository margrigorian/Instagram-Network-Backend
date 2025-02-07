import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { getSubscription, deleteSubscription } from "../db/slices/accounts.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function deleteSubscriptionOnFollowingController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;
    const { user } = req.body;
    const { login } = req.params; // пользователь, на странице которого мы находимся
    const { login_of_following } = req.query; // подписка этого пользователя

    const isExistedLogin = await checkLogin(login);
    // логин пользователя, на странице которого мы находимся, верен?
    if (isExistedLogin.login) {
      let isExistedLoginOfFollowing: { login: string | null } = { login: null };
      // проверка, требуемая типизацией
      if (typeof login_of_following === "string" && login_of_following !== user.login) {
        isExistedLoginOfFollowing = await checkLogin(login_of_following);
      }
      // логин following пользователя, от которого мы хотим отписаться, верен?
      if (isExistedLoginOfFollowing.login) {
        // проверяем является ли пользователь (req.param), на странице которого мы находимся,
        // подписчиком following (req.query), от которого мы хотим отписаться
        let subscription = await getSubscription(isExistedLogin.login, isExistedLoginOfFollowing.login);
        // есть соответствие
        if (subscription) {
          // подписаны ли уже мы на этого following?
          // проверка в случае, если мы находимся на странице другого пользователя
          if (login !== user.login) {
            subscription = await getSubscription(user.login, isExistedLoginOfFollowing.login);
          }

          // подписка существует, удаляем
          if (subscription) {
            await deleteSubscription(user.login, isExistedLoginOfFollowing.login);
            response.data = {
              data: subscription
            };
            return res.status(200).json(response);
          }
        }
      }
    }

    message = "400 Bad Request";
    response.error = {
      message
    };
    return res.status(400).json(response);
  } catch (e) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
