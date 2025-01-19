import { Request, Response } from "express";
import getResponseTemplate from "../lib/responseTemplate.js";
import { getPost } from "../db/slices/posts.js";
import { getComments } from "../db/slices/comments.js";

export async function getCommentsController(req: Request, res: Response) {
  try {
    // не проверяем в middleware, т.к. это всегда string и параметр должен быть, иначе меняется путь
    const { post_id } = req.params;
    const response = getResponseTemplate();
    // проверяем наличие поста

    const post = await getPost(post_id);

    if (post) {
      const comments = await getComments(post_id);
      response.data = {
        data: comments
      };
      return res.status(200).json(response);
    }

    // id неверно, пост не найден
    const message: string = "404 Not Found";
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
