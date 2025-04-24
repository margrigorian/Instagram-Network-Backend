import { Request, Response } from "express";
import { getInbox } from "../db/slices/chats.js";
import { getSearchAccounts } from "../db/slices/accounts.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import { IChat } from "../db/types/chatsAndMessagesSliceTypes.js";
import { IListedAccount } from "../db/types/accountsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function getInboxController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const search = req.query.search;
    let chats: IChat[] = [];
    let searchAccounts: IListedAccount[] = [];
    const response = getResponseTemplate();

    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      searchAccounts = await getSearchAccounts(search);
    } else {
      chats = await getInbox(user.login);
    }

    response.data = {
      data: {
        chats,
        searchAccounts
      }
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
