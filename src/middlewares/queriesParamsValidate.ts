import { Request, Response, NextFunction } from "express";
import z from "zod";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export function queriesParamsValidate(params: string) {
  return (req: Request, res: Response<IResponse>, next: NextFunction) => {
    try {
      interface SchemaMap {
        [action: string]: z.ZodSchema; // Dynamic property names with string keys for actions
      }

      const schemas: SchemaMap = {
        optionalProperties: z.object({
          // преобразуем query-параметр в число, при несоответствии будет ошибка
          comment_id: z.preprocess(a => Number(a), z.number()).optional(),
          liked_comment_id: z.preprocess(a => Number(a), z.number()).optional(),
          like_on_post: z.literal("false").optional(),
          img_index: z.preprocess(a => Number(a), z.number()).optional()
        }),
        loginOfFollowing: z.object({
          login_of_following: z.string().min(1)
        }),
        searchParam: z.object({
          search: z.string().optional()
        }),
        exploreParams: z.object({
          keyword: z.string().optional(),
          search: z.string().optional()
        })
      };

      const validatedData = schemas[params].safeParse(req.query);

      if (validatedData.success) {
        next();
        return;
      }

      const message: string = "The sent data is incorrect";
      const response = getResponseTemplate();
      response.error = {
        message
      };

      return res.status(406).json(response);
    } catch (err) {
      const message: string = "500 Server Error";
      const response = getResponseTemplate();
      response.error = {
        message
      };
      return res.status(500).json(response);
    }
  };
}
