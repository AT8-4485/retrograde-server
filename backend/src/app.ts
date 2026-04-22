import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { publicLimiter } from './middleware/rateLimiter';
import feedRouter from './routes/feed';
import authRouter from './routes/auth';
import bookmarkRouter from './routes/bookmarks';
import notificationRouter from './routes/notifications';
import gameRouter from './routes/games';

const app = express();


// Security and utility middleware
app.use(helmet());
app.use(express.json({ limit: '5mb' }));

// Utilize our Pino structured logger to attach a UUID and track requests
app.use(requestLogger);

// Note: Morgan can be kept for simple console development logs, but Pino is the source of truth.
// We can omit Morgan since requestLogger now handles basic request lifecycle logs.

// Mount routes
app.use('/v1/feed', publicLimiter, feedRouter);
app.use('/v1/auth', authRouter);
app.use('/v1/bookmarks', bookmarkRouter);
app.use('/v1/notifications', notificationRouter);
app.use('/v1/games', gameRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

export default app;
