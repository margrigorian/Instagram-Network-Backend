import { Request, Response } from "express";
import { getPost } from "../db/slices/posts.js";
import { getKeywordsOfCaptionAndUpdatePublication } from "../servicing/postsService.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function putPublicationController(req: Request, res: Response<IResponse>) {
  try {
    const { user } = req.body;
    const { post_id } = req.params;
    const post = await getPost(post_id);
    const response = getResponseTemplate();
    let message;

    if (post) {
      if (post.user_login === user.login) {
        const caption = req.body.caption;
        const updatedPost = await getKeywordsOfCaptionAndUpdatePublication(post_id, caption, user.login);
        response.data = {
          data: updatedPost
        };
        return res.status(201).json(response);
      } else {
        message = "403 Forbidden"; // прав на действие нет
        response.error = {
          message
        };
        return res.status(403).json(response);
      }
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
