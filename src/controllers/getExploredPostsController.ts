import { Request, Response } from "express";
import { getPosts } from "../db/slices/posts.js";
import { getSearchAccounts } from "../db/slices/accounts.js";
import { IPost } from "../db/types/postsSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { IListedAccount } from "../db/types/accountsSliceTypes.js";

export async function getExploredPostsController(req: Request, res: Response<IResponse>) {
  try {
    const search = req.query.search;
    const keyword = req.query.keyword;
    let exploredPosts: IPost[] = [];
    let searchAccounts: IListedAccount[] = [];
    const response = getResponseTemplate();

    if (search && typeof search === "string") {
      // необходимый запрос для панели search c фронтенда
      searchAccounts = await getSearchAccounts(search);
    } else if (keyword && typeof keyword === "string") {
      exploredPosts = await getPosts("hashtag", `#${keyword}`);
    } else {
      exploredPosts = await getPosts();
    }

    response.data = {
      data: {
        exploredPosts,
        searchAccounts
      }
    };
    return res.status(200).json(response);
  } catch (e) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
