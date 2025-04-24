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
          post_id: z.string().min(1).optional(),
          login_of_following: z.string().min(1).optional(),
          avatar: z.literal("false").optional(),
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
        }),
        chatAndSearchParams: z.object({
          chatId: z.preprocess(id => Number(id), z.number().positive()),
          // chatId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()),
          inbox: z.union([z.literal("true"), z.literal("false")]).optional(),
          messageId: z.preprocess(id => Number(id), z.number().positive()).optional(),
          // messageId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
          readMessageId: z.preprocess(id => Number(id), z.number().positive()).optional(),
          // readMessageId: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
          participant: z
            .string()
            .min(1)
            // в refine включаем свою функцию проверки
            .refine(value => value.trim().length > 0, {
              message: "Login cannot consist of spaces"
            })
            .optional(),
          search: z.string().optional()
        })
      };

      let queryParams; // оставляем any, так как типизация будет проходить через zod

      if (req.params.id) {
        const { id } = req.params; // для обработки запросов по сообщениям
        queryParams = { ...req.query, chatId: id };
      } else {
        queryParams = req.query;
      }

      const validatedData = schemas[params].safeParse(queryParams);

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
