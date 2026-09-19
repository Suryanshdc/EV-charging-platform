import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Validates req.body against a Zod schema, replacing it with the parsed
 * (and type-coerced) result. Throws ZodError on failure, caught by errorHandler.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}
