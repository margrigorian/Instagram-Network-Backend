import { Request, Response } from "express";
import { getPosts } from "../db/slices/posts.js";
import { getRecommendedAccounts, getSearchAccounts } from "../db/slices/accounts.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import { IPost } from "../db/types/postsSliceTypes.js";
import { IRecommendedAccount, ISearchAccount } from "../db/types/accountsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function homeController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const search = req.query.search;
    let posts: IPost[] = [];
    let recommendedAccounts: IRecommendedAccount[] = [];
    let searchAccounts: ISearchAccount[] = [];
    const response = getResponseTemplate();

    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      searchAccounts = await getSearchAccounts(search);
    } else {
      posts = await getPosts("topical_posts", user.login);
      recommendedAccounts = await getRecommendedAccounts(user.login);
    }

    response.data = {
      data: {
        posts,
        recommendedAccounts,
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
