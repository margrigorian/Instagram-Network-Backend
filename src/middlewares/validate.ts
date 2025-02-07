import { Request, Response, NextFunction } from "express";
import z from "zod";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export function validate(action: string) {
  return (req: Request, res: Response<IResponse>, next: NextFunction) => {
    try {
      // для userInformationUpdate, со страницы profile/edit
      if (req.body.recommendation && typeof req.body.recommendation === "string") {
        // преобразуем, т.к. в FormData все значения str
        if (req.body.recommendation === "false") {
          req.body.recommendation = false;
        } else if (req.body.recommendation === "true") {
          req.body.recommendation = true;
        }
      }

      interface SchemaMap {
        [action: string]: z.ZodSchema; // Dynamic property names with string keys for actions
      }

      const schemas: SchemaMap = {
        registration: z.object({
          login: z.string().min(1),
          username: z.string().optional(),
          contact: z.union([
            z.string().email(),
            z.string().refine((value: string) => {
              const phoneRegex = /^(\+?\d{1,3})?[- .]?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}(?:\s*\(\d{1,5}\))?$/;
              return phoneRegex.test(value);
            })
          ]),
          password: z.string().min(5)
        }),
        authorization: z.object({
          login: z.string().min(1),
          password: z.string().min(5)
        }),
        userInformationUpdate: z.object({
          about: z.string(),
          gender: z.string().min(1).nullable(),
          recommendation: z.boolean()
        }),
        postOrUpdatePublication: z.object({
          caption: z.string()
        }),
        postComment: z.object({
          content: z.string().min(1),
          under_comment: z.number().nullable()
        })
      };

      let validatedData;

      // так как на странице публикации совершаются несколько действий по методу post
      if (action === "postComment") {
        if (req.body.comment) {
          validatedData = schemas["postComment"].safeParse(req.body);
        } else {
          // нет comment body, значит отправлен запрос на лайк к комментарию или посту
          next();
          return;
        }
      } else {
        // все остальные случаи валидации
        validatedData = schemas[action].safeParse(req.body);
      }

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
