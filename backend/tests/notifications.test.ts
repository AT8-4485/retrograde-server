import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/utils/db';

describe('notifications token API', () => {
  it('registers an anonymous push token without auth', async () => {
    const res = await request(app)
      .post('/v1/notifications/token')
      .send({
        token: 'ExponentPushToken[anonymous-ios-token]',
        platform: 'ios',
        deviceName: 'iPhone',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBe('ExponentPushToken[anonymous-ios-token]');
    expect(res.body.platform).toBe('ios');
    expect(res.body.lastSeenAt).toBeDefined();
    expect(res.body.userId).toBeUndefined();
    expect(res.body.preferences).toBeUndefined();

    const stored = await prisma.pushToken.findUnique({
      where: { token: 'ExponentPushToken[anonymous-ios-token]' },
    });
    expect(stored).toBeTruthy();
    expect(stored?.userId).toBeNull();
  });

  it('upserts an existing anonymous push token by token value', async () => {
    await request(app)
      .post('/v1/notifications/token')
      .send({
        token: 'ExponentPushToken[upsert-token]',
        platform: 'ios',
      });

    const res = await request(app)
      .post('/v1/notifications/token')
      .send({
        token: 'ExponentPushToken[upsert-token]',
        platform: 'android',
        deviceName: 'Pixel',
      });

    expect(res.status).toBe(201);
    expect(res.body.platform).toBe('android');
    expect(res.body.deviceName).toBe('Pixel');

    const stored = await prisma.pushToken.findMany({
      where: { token: 'ExponentPushToken[upsert-token]' },
    });
    expect(stored).toHaveLength(1);
  });

  it('deletes an anonymous push token by token value without auth', async () => {
    await request(app)
      .post('/v1/notifications/token')
      .send({
        token: 'ExponentPushToken[delete-token]',
        platform: 'ios',
      });

    const res = await request(app)
      .delete('/v1/notifications/token')
      .send({ token: 'ExponentPushToken[delete-token]' });

    expect(res.status).toBe(204);

    const stored = await prisma.pushToken.findUnique({
      where: { token: 'ExponentPushToken[delete-token]' },
    });
    expect(stored).toBeNull();
  });

  it('keeps preferences protected by auth', async () => {
    const res = await request(app)
      .patch('/v1/notifications/preferences')
      .send({
        tokenId: 'token-id',
        preferences: '{}',
      });

    expect(res.status).toBe(401);
  });
});
