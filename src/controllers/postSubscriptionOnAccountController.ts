import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { getSubscription, postSubscription } from "../db/slices/accounts.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function postSubscriptionOnAccountController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;
    const { user } = req.body;
    const { login } = req.params;
    const isExistedAccount = await checkLogin(login);

    if (isExistedAccount.login && isExistedAccount.login !== user.login) {
      const subscription = await getSubscription(user.login, login);
      // добавляем подписку, если она отсутствует
      if (subscription === null) {
        const newSubscription = await postSubscription(user.login, login);
        response.data = {
          data: newSubscription
        };
        return res.status(201).json(response);
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
