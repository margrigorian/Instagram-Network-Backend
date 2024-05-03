import { Request, Response, NextFunction } from "express";
import z from "zod";
import getResponseTemplate, { IResponse } from "../lib/responseTemplate.js";

export function validate(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      interface SchemaMap {
        [action: string]: z.ZodSchema; // Dynamic property names with string keys for actions
      }

      const schemas: SchemaMap = {
        registration: z.object({
          contact: z.union([
            z.string().email(),
            z.string().refine((value: string) => {
              const phoneRegex = /^(\+?\d{1,3})?[- .]?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}(?:\s*\(\d{1,5}\))?$/;
              return phoneRegex.test(value);
            })
          ]),
          login: z.string().min(1),
          username: z.string().optional(),
          password: z.string().min(5)
        }),
        authorization: z.object({
          login: z.string().min(1),
          password: z.string().min(5)
        })
      };

      const validatedData = schemas[action].safeParse(req.body);

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
