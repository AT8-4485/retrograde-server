import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(
    public status: number,
    public type: string,
    public title: string,
    public detail: string
  ) {
    super(detail);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const instance = req.originalUrl;
  const reqLogger = req.log || logger; 

  if (err instanceof ApiError) {
    reqLogger.warn(
      { err: { message: err.message, stack: err.stack }, type: err.type, status: err.status },
      `ApiError thrown: ${err.title}`
    );
    res.status(err.status).json({
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance,
    });
    return;
  }

  if (err instanceof ZodError || err.name === 'ZodError') {
    let detail = 'Validation failed';
    try {
      const issues = (err as any).errors || (err as any).issues || [];
      detail = issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    } catch (e) {
      reqLogger.error({ parseError: e }, 'Failed to parse ZodError detail');
    }
    reqLogger.warn({ err, detail }, 'Zod Validation Error');
    res.status(400).json({
      type: 'https://api.retrogradenews.app/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail,
      instance,
    });
    return;
  }

  reqLogger.error(
    { err: { message: err.message, stack: err.stack }, instance },
    'Unhandled Internal Server Error'
  );

  res.status(500).json({
    type: 'https://api.retrogradenews.app/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred while processing your request.',
    instance,
  });
};
