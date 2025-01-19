import { Request, Response, NextFunction } from "express";
import z from "zod";
import getResponseTemplate from "../lib/responseTemplate.js";

export function queriesParamsValidate(params: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      interface SchemaMap {
        [action: string]: z.ZodSchema; // Dynamic property names with string keys for actions
      }

      const schemas: SchemaMap = {
        optionalProperties: z.object({
          // преобразуем query-параметр в число, при несоответствии будет ошибка
          comment_id: z.preprocess(a => Number(a), z.number()).optional()
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
