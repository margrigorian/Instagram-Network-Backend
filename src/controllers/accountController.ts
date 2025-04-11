import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { getAccountInfo, getSearchAccounts } from "../db/slices/accounts.js";
import { IAccount, IListedAccount } from "../db/types/accountsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function accountController(req: Request, res: Response<IResponse>) {
  try {
    // не проверяем в middleware, т.к. это всегда string и параметр должен быть, иначе меняется путь
    const { login } = req.params;
    const search = req.query.search;
    let account: IAccount | null = null;
    let searchAccounts: IListedAccount[] = [];
    const response = getResponseTemplate();

    const checkedLogin = await checkLogin(login);

    if (checkedLogin) {
      // проверка, требуемая типизацией
      if (search && typeof search === "string") {
        // необходимый запрос для панели search c фронтенда
        searchAccounts = await getSearchAccounts(search);
      } else {
        account = await getAccountInfo(login);
      }

      response.data = {
        data: {
          accountInfo: account,
          searchAccounts
        }
      };

      return res.status(200).json(response);
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
