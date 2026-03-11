import pino from 'pino';
import { v7 as uuidv7 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

// Base logger instance
export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  }),
});

// Middleware to inject request ID and create a child logger for the request
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqId = uuidv7();
  
  // Attach child logger to the request object so routes/services can use it
  req.log = logger.child({ reqId });

  req.log.info({ method: req.method, url: req.originalUrl }, 'Incoming Request');

  res.on('finish', () => {
    req.log.info({ 
      statusCode: res.statusCode, 
      method: req.method, 
      url: req.originalUrl 
    }, 'Request Completed');
  });

  next();
};

// Extend the Express Request type to include our logger
declare global {
  namespace Express {
    interface Request {
      log: pino.Logger;
    }
  }
}
