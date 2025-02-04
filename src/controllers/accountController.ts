import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { getAccountInfo } from "../db/slices/accounts.js";

export async function accountController(req: Request, res: Response<IResponse>) {
  try {
    // не проверяем в middleware, т.к. это всегда string и параметр должен быть, иначе меняется путь
    const { login } = req.params;
    const response = getResponseTemplate();

    const account = await getAccountInfo(login);

    if (account) {
      response.data = {
        data: account
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
