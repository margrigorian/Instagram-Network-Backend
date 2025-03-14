import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { getSubscription, postSubscription } from "../db/slices/accounts.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function postSubscriptionOnFollowingController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;
    const { user } = req.body;
    const { login } = req.params; // пользователь, на странице которого мы находимся
    const { login_of_following } = req.query; // подписка этого пользователя

    // на своей странице по пути /following не могут осуществляться подписки
    if (login !== user.login) {
      const isExistedLogin = await checkLogin(login);
      // логин пользователя, на странице которого мы находимся, верен?
      if (isExistedLogin.login) {
        let isExistedLoginOfFollowing: { login: string | null } = { login: null };
        // проверка, требуемая типизацией
        if (typeof login_of_following === "string" && login_of_following !== user.login) {
          isExistedLoginOfFollowing = await checkLogin(login_of_following);
        }
        // логин following пользователя, на которого мы хотим подписаться, верен?
        if (isExistedLoginOfFollowing.login) {
          // проверяем является ли пользователь (req.param), на странице которого мы находимся,
          // подписчиком following (req.query), на которого и мы хотим подписаться
          const isExistedSubscription = await getSubscription(isExistedLogin.login, isExistedLoginOfFollowing.login);
          // есть соответствие
          if (isExistedSubscription) {
            // подписаны ли уже мы на этого following?
            const subscription = await getSubscription(user.login, isExistedLoginOfFollowing.login);

            // добавляем подписку, если она отсутствует
            if (subscription === null) {
              const newSubscription = await postSubscription(user.login, isExistedLoginOfFollowing.login);
              response.data = {
                data: newSubscription
              };
              return res.status(201).json(response);
            }
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
