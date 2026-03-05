import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

/**
 * Custom handler function for express-rate-limit that utilizes the ApiError class.
 * This ensures rate limit errors conform to the RFC 9457 error standard.
 */
const rateLimitHandler = (req: Request, res: Response, next: NextFunction, options: Options) => {
  next(
    new ApiError(
      options.statusCode,
      'https://api.retrogradenews.app/errors/too-many-requests',
      'Too Many Requests',
      options.message as string
    )
  );
};

/**
 * Public Unauthenticated Tier
 * Limit: 30 requests per 1 minute
 */
export const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 requests limit per IP
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: 429,
  message: 'Public rate limit exceeded. Please try again later.',
  handler: rateLimitHandler,
});

/**
 * Authenticated Tier
 * Limit: 120 requests per 1 minute
 */
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120, // 120 requests limit per IP/User
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: 'Authenticated rate limit exceeded. Please try again later.',
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Note: Once auth middleware is injecting `req.user`, this should prioritize 
    // user ID over IP to accurately track the limit across devices
    // return req.user?.id || req.ip;
    return req.ip || 'unknown'; 
  },
});

/**
 * OTP Request Tier
 * Limit: 5 requests per 15 minutes (Keyed to the requested email address or IP)
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: 'Too many OTP requests for this email. Please try again in 15 minutes.',
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Check if email is in the request body for POST /auth/otp
    if (req.body && req.body.email) {
      return req.body.email;
    }
    // Fallback to IP if body parsing failed or email is missing
    return req.ip || 'unknown';
  },
});
