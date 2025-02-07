import { Request, Response } from "express";
import { getPost, getPostsImages, getUserLikeOnPost, deleteUserLikeOnPost } from "../db/slices/posts.js";
import { deletePostsImage, deletePublication } from "../servicing/postsService.js";
import { getComment, getUserLikeOnComment, deleteComment, deleteUserLikeOnComment } from "../db/slices/comments.js";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export async function deleteCommentAndLikesAndPostsImagesAndPublicationController(req: Request, res: Response<IResponse>) {
  try {
    const { user } = req.body;
    const { post_id } = req.params;
    const post = await getPost(post_id);
    const { comment_id, liked_comment_id, like_on_post, img_index } = req.query;
    const response = getResponseTemplate();
    let message;

    // пост с таким id существует
    if (post) {
      // удаление комментария
      if (comment_id) {
        const commentId = Number(comment_id);
        const comment = await getComment(commentId);
        // комментарий существет и он связан текущим постом
        if (comment && comment.post_id === post.id) {
          // проверка прав на удаление (свой пост или свой комментарий)
          if (post.user_login === user.login || comment.user_login === user.login) {
            const deletedComment = await deleteComment(commentId);
            response.data = {
              data: deletedComment
            };
            return res.status(200).json(response);
          } else {
            message = "403 Forbidden"; // прав на действие нет
            response.error = {
              message
            };
            return res.status(403).json(response);
          }
        }
      } else if (liked_comment_id) {
        // удаление лайка с комментария
        const likedCommentId = Number(liked_comment_id);
        const comment = await getComment(likedCommentId);
        // комментарий существет и он связан текущим постом
        if (comment && comment.post_id === post.id) {
          // проверка наличия лайка
          const user_like = await getUserLikeOnComment(likedCommentId, user.login);
          //   лайк стоит, удаляем
          if (user_like) {
            await deleteUserLikeOnComment(likedCommentId, user.login);
            response.data = {
              data: user_like
            };
            return res.status(200).json(response);
          }
        }
      } else if (like_on_post) {
        // удаление лайка с поста
        const user_like = await getUserLikeOnPost(post_id, user.login);
        //   лайк стоит, удаляем
        if (user_like) {
          await deleteUserLikeOnPost(post_id, user.login);
          response.data = {
            data: user_like
          };
          return res.status(200).json(response);
        }
      } else if (img_index) {
        // удаление изображения в посте
        const posts_images = await getPostsImages(post_id);
        // изображений больше одного, удаление допустимо
        if (posts_images.length > 1) {
          const image = posts_images.find(el => el.img_index === Number(img_index));
          // изображение с таким индексом присутствует
          if (image) {
            if (post.user_login === user.login) {
              await deletePostsImage(post_id, image);
              response.data = {
                data: { ...image, post_id }
              };
              return res.status(200).json(response);
            } else {
              message = "403 Forbidden"; // прав на действие нет
              response.error = {
                message
              };
              return res.status(403).json(response);
            }
          }
        }
      } else {
        // удаление публикации
        if (post.user_login === user.login) {
          const deletedPublication = await deletePublication(post_id);
          response.data = {
            data: deletedPublication
          };
          return res.status(200).json(response);
        } else {
          message = "403 Forbidden"; // прав на действие нет
          response.error = {
            message
          };
          return res.status(403).json(response);
        }
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
