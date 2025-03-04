import { Request, Response } from "express";
import { getAccountInfo, searchAccounts } from "../db/slices/accounts.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function accountController(req: Request, res: Response<IResponse>) {
  try {
    // не проверяем в middleware, т.к. это всегда string и параметр должен быть, иначе меняется путь
    const { login } = req.params;
    const search = req.query.search;
    const response = getResponseTemplate();

    // проверка, требуемая типизацией
    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      const accounts = await searchAccounts(search);

      response.data = {
        data: {
          // лишний запрос по аккаунту никчему
          accountInfo: null,
          searchAccounts: accounts
        }
      };

      return res.status(200).json(response);
    } else {
      const account = await getAccountInfo(login);

      if (account) {
        response.data = {
          data: {
            accountInfo: account,
            searchAccounts: []
          }
        };

        return res.status(200).json(response);
      }
    }

    const message: string = "400 Bad Request";
    response.error = {
      message
    };
    return res.status(404).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
