import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { addLikeToPost, getPost, getUserLikeOnPost } from "../db/slices/posts.js";
import { getKeyWordsOfTextAndPostComment } from "../servicing/commentService.js";
import { addLikeToComment, getComment, getUserLikeOnComment } from "../db/slices/comments.js";

export async function postCommentAndLikesController(req: Request, res: Response<IResponse>) {
  try {
    const { post_id } = req.params;
    const post = await getPost(post_id);
    const { content, under_comment, user } = req.body;
    const response = getResponseTemplate();
    const message = "400 Bad Request";

    // пост с таким id существует
    if (post) {
      // добавить комментария, если есть body
      if (content) {
        // если указан родительский комментарий, проверяем его наличие
        if (under_comment) {
          const parentalComment = await getComment(under_comment);
          // если такого комментарий нет или же он не относится к этому посту, направялем ошибку
          if (parentalComment === null || parentalComment.post_id !== post.id) {
            response.error = {
              message
            };
            return res.status(400).json(response);
          }
        }

        const comment = await getKeyWordsOfTextAndPostComment(post_id, content, under_comment, user.login);
        response.data = {
          data: comment
        };
        return res.status(201).json(response);
      } else if (req.query.comment_id) {
        // добавить лайк на комментарий, если есть query-параметр comment_id
        const comment_id = Number(req.query.comment_id);
        // проверка
        const comment = await getComment(comment_id);
        // комментарий существет и он связан текущим постом
        if (comment && comment.post_id === post.id) {
          // проверка на наличие лайка к комментарию
          const user_like = await getUserLikeOnComment(comment_id, user.login);
          if (user_like === null) {
            // лайка нет, ставим
            const comment_like = await addLikeToComment(comment_id, user.login);
            response.data = {
              data: comment_like
            };
            return res.status(201).json(response);
          }
        }
      } else {
        // добавить лайк на публикацию
        // проверка
        const user_like = await getUserLikeOnPost(post.id, user.login);
        // лайка нет, ставим
        if (user_like === null) {
          const post_like = await addLikeToPost(post.id, user.login);
          response.data = {
            data: post_like
          };
          return res.status(201).json(response);
        }
      }
    }

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
