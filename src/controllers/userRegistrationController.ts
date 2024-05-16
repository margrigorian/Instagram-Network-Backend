import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { checkLogin } from "../db/slices/users.js";
import { addNewUser } from "../servicing/authService.js";
import { getToken } from "../servicing/authService.js";

export async function userRegistrationController(req: Request, res: Response<IResponse>) {
  try {
    let message: string;
    const response = getResponseTemplate();

    const { contact, login, username, password } = req.body;
    const checkedLogin = await checkLogin(login);

    if (checkedLogin.login === null) {
      const user = await addNewUser(contact, login, username, password);
      // после регистрации сразу произойдет переход на home page
      const token = getToken(login);
      response.data = {
        data: {
          user,
          token
        }
      };
      return res.status(201).json(response);
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