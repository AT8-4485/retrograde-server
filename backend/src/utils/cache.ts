import { createClient } from 'redis';
import { config } from './config';

export const redisClient = createClient({
  url: config.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

const STD_TTL = 86400; // 24 hours

export const cache = {
  connect: async () => {
    try {
      await redisClient.connect();
      console.log('📦 Connected to Redis successfully');
    } catch (err) {
      console.error('⚠️ Redis connection failed, cache will fail-open:', err);
    }
  },
  quit: async () => {
    try {
      await redisClient.quit();
      console.log('📦 Redis connection closed gracefully');
    } catch (err) {
      console.error('⚠️ Error closing Redis connection:', err);
    }
  },
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) as T : null;
    } catch (error) {
      console.error(`⚠️ Redis GET error for key ${key}, failing open:`, error);
      return null;
    }
  },
  set: async (key: string, value: any, ttlSeconds: number = STD_TTL): Promise<void> => {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
    } catch (error) {
      console.error(`⚠️ Redis SET error for key ${key}:`, error);
    }
  },
  flushAll: async (): Promise<void> => {
    try {
      await redisClient.flushAll();
    } catch (error) {
      console.error(`⚠️ Redis FLUSHALL error:`, error);
    }
  },
  acquireLock: async (key: string, ttlSeconds: number): Promise<boolean> => {
    try {
      // SET NX returns "OK" if set, null if it already exists
      const result = await redisClient.set(key, 'locked', {
        NX: true,
        EX: ttlSeconds
      });
      return result === 'OK';
    } catch (error) {
      console.error(`⚠️ Redis acquireLock error for key ${key}:`, error);
      // Fail safely. If Redis is down, return false to prevent thundering herd
      return false;
    }
  }
};
