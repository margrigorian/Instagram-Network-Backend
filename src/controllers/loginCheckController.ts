import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function loginCheckController(req: Request, res: Response<IResponse>) {
  try {
    // не проверяем в middleware, т.к. это всегда string и параметр должен быть, иначе меняется путь
    const { login } = req.params;
    const checkedLogin = await checkLogin(login);
    const response = getResponseTemplate();

    response.data = {
      data: checkedLogin
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
