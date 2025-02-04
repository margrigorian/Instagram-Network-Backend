import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { checkLogin } from "../db/slices/users.js";
import { getFollowers } from "../db/slices/accounts.js";

export async function getFollowersController(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;
    const { user } = req.body;
    const { login } = req.params;
    const isExistedAccount = await checkLogin(login);
    let search: string;
    if (req.query.search && typeof req.query.search === "string") {
      search = req.query.search;
    } else {
      search = "";
    }

    if (isExistedAccount.login) {
      const followers = await getFollowers(user.login, login, search);
      response.data = {
        data: followers
      };
      return res.status(200).json(response);
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
