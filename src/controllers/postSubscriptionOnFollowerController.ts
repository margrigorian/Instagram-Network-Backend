import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { checkLogin } from "../db/slices/users.js";
import { getSubscription, postSubscription } from "../db/slices/accounts.js";

export async function postSubscriptionOnFollowerController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;
    const { user } = req.body;
    const { login } = req.params; // пользователь, на странице которого мы находимся
    const { login_of_following } = req.query; // подписчик этого пользователя

    const isExistedLogin = await checkLogin(login);
    // логин пользователя, на странице которого мы находимся, верен?
    if (isExistedLogin.login) {
      let isExistedLoginOfFollowing: { login: string | null } = { login: null };
      // проверка, требуемая типизацией
      if (typeof login_of_following === "string" && login_of_following !== user.login) {
        isExistedLoginOfFollowing = await checkLogin(login_of_following);
      }
      // логин follower пользователя, на которого мы хотим подписаться, верен?
      if (isExistedLoginOfFollowing.login) {
        // проверяем относится ли follower (req.query), на которого мы хотим подписаться,
        // к пользователю (req.param), на странице которого мы находимся
        const isExistedSubscription = await getSubscription(isExistedLoginOfFollowing.login, isExistedLogin.login);
        // есть соответствие
        if (isExistedSubscription) {
          // подписаны ли уже мы на этого follower?
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
