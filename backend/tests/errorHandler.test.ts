import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { z } from 'zod';
import { ApiError, errorHandler } from '../src/middleware/errorHandler';
import { requestLogger } from '../src/utils/logger';

// Setup test app
const app = express();
app.use(express.json());
app.use(requestLogger);

app.get('/v1/test-api-error', (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'https://api.retrogradenews.app/errors/not-found', 'Resource Not Found', 'The requested test resource was not found.'));
});

app.post('/v1/test-zod-error', (req: Request, res: Response, next: NextFunction) => {
  try {
    z.object({ email: z.string().email() }).parse(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

app.get('/v1/test-generic-error', (req: Request, res: Response, next: NextFunction) => {
  next(new Error('Something blew up out of nowhere'));
});

app.use(errorHandler);

describe('RFC 9457 Error Handler', () => {
  it('should correctly format an explicit ApiError and include instance path', async () => {
    const res = await request(app).get('/v1/test-api-error');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      type: 'https://api.retrogradenews.app/errors/not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: 'The requested test resource was not found.',
      instance: '/v1/test-api-error',
    });
  });

  it('should correctly intercept ZodError and format it to RFC 9457', async () => {
    const res = await request(app)
      .post('/v1/test-zod-error')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      type: 'https://api.retrogradenews.app/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: expect.stringContaining('email: Invalid email'),
      instance: '/v1/test-zod-error',
    });
  });

  it('should fallback to 500 Internal Server Error for generic unhandled errors', async () => {
    const res = await request(app).get('/v1/test-generic-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      type: 'https://api.retrogradenews.app/errors/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred while processing your request.',
      instance: '/v1/test-generic-error',
    });
  });
});
