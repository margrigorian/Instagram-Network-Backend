import { Request, Response } from "express";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";
import { getKeywordsOfCaptionAndPostPublication } from "../servicing/postsService.js";

export async function postNewPublication(req: Request, res: Response<IResponse>) {
  try {
    const response = getResponseTemplate();
    let message: string;

    const { user, caption } = req.body;
    const images = req.files as Express.Multer.File[] | undefined;

    if (images && images.length > 0) {
      const newPost = await getKeywordsOfCaptionAndPostPublication(user.login, caption, images);

      response.data = {
        data: newPost
      };
      return res.status(201).json(response);
    }

    // через postman не были отправлены фото, например
    message = "400 Bad Request";
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
