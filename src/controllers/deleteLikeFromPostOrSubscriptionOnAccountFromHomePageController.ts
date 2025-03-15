import { Request, Response } from "express";
import { checkLogin } from "../db/slices/users.js";
import { deleteSubscription, getSubscription } from "../db/slices/accounts.js";
import { getPost, getUserLikeOnPost, deleteUserLikeOnPost } from "../db/slices/posts.js";
import { IUser } from "../db/types/usersSliceTypes.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function deleteLikeFromPostOrSubscriptionOnAccountFromHomePageController(req: Request, res: Response<IResponse>) {
  try {
    const user: IUser = req.body.user;
    const params = req.query;
    const response = getResponseTemplate();

    if (params.post_id && typeof params.post_id === "string") {
      const post = await getPost(params.post_id);
      // пост существует, движемся дальше
      if (post) {
        const user_like = await getUserLikeOnPost(post.id, user.login);
        // лайк существует, удаляем
        if (user_like) {
          await deleteUserLikeOnPost(post.id, user.login);
          response.data = {
            data: user_like
          };
          return res.status(200).json(response);
        }
      }
    } else if (params.login_of_following && typeof params.login_of_following === "string" && params.login_of_following !== user.login) {
      const isExistedAccount = await checkLogin(params.login_of_following);

      if (isExistedAccount.login) {
        const subscription = await getSubscription(user.login, params.login_of_following);
        // подписка существует, удаляем ее
        if (subscription) {
          await deleteSubscription(user.login, params.login_of_following);
          response.data = {
            data: subscription
          };
          return res.status(200).json(response);
        }
      }
    }

    const message = "400 Bad Request";
    response.error = {
      message
    };
    return res.status(400).json(response);
  } catch (err) {
    const message: string = "500 Server Error";
    const response = getResponseTemplate();
    response.error = {
      message
    };
    return res.status(500).json(response);
  }
}
