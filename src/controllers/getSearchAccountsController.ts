import { Request, Response } from "express";
import { getSearchAccounts } from "../db/slices/accounts.js";
import { ISearchAccount } from "../db/types/accountsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function getSearchAccountsController(req: Request, res: Response<IResponse>) {
  try {
    const search = req.query.search;
    const response = getResponseTemplate();
    let accounts: ISearchAccount[] = [];

    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      accounts = await getSearchAccounts(search);
    }

    response.data = {
      data: accounts
    };
    return res.status(200).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
