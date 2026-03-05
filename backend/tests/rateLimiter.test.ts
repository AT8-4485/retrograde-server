import express from 'express';
import request from 'supertest';
import { publicLimiter, otpLimiter } from '../src/middleware/rateLimiter';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();
app.use(express.json());
// Must set trust proxy if behind proxy, but here it's fine
app.set('trust proxy', 1);

app.get('/v1/public-endpoint', publicLimiter, (req, res) => {
  res.json({ success: true });
});

app.post('/v1/auth/otp', otpLimiter, (req, res) => {
  res.json({ success: true });
});

app.use(errorHandler);

describe('Rate Limiters', () => {
  it('publicLimiter should allow 30 requests and block the 31st', async () => {
    // Make 30 successful requests
    for (let i = 0; i < 30; i++) {
      const res = await request(app).get('/v1/public-endpoint');
      expect(res.status).toBe(200);
    }

    // The 31st request should be blocked
    const resBlocked = await request(app).get('/v1/public-endpoint');
    expect(resBlocked.status).toBe(429);
    
    // Check RFC 9457 error format is correctly applied by errorHandler
    expect(resBlocked.body).toMatchObject({
      type: 'https://api.retrogradenews.app/errors/too-many-requests',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Public rate limit exceeded. Please try again later.',
      instance: '/v1/public-endpoint',
    });
    
    // Check standard rate limit header
    expect(resBlocked.headers['retry-after']).toBeDefined();
  });

  it('otpLimiter should throttle based on email in body', async () => {
    // Send 5 OTP requests for userA
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/v1/auth/otp')
        .send({ email: 'userA@example.com' });
      expect(res.status).toBe(200);
    }

    // 6th request for userA should be blocked
    const resBlockedA = await request(app)
      .post('/v1/auth/otp')
      .send({ email: 'userA@example.com' });
    expect(resBlockedA.status).toBe(429);

    // 1st request for userB should succeed
    const resSuccessB = await request(app)
      .post('/v1/auth/otp')
      .send({ email: 'userB@example.com' });
    expect(resSuccessB.status).toBe(200);
  });
});
