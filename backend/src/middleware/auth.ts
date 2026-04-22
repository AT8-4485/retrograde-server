import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { ApiError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Access token expired'));
    }
    return next(new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid access token'));
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    // If token is present but invalid, we still treat as unauthenticated
    // rather than throwing an error, or we could throw 401. 
    // Usually, optional auth means "if you provide it, it must be valid".
    // But for games, we can just proceed as anon if it fails.
    // Let's be strict: if they TRY to auth and fail, we tell them.
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Access token expired'));
    }
    next();
  }
};
