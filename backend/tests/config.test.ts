import { validateEnv } from '../src/utils/config';
import { ZodError } from 'zod';

describe('Environment Variables Validation', () => {
  it('should pass validation with all required valid variables', () => {
    const validEnv = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
      PUSH_NOTIFICATIONS_ENABLED: 'true',
      PORT: '3000',
    };

    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('should throw a ZodError if a required variable is missing', () => {
    const invalidEnv = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      // DATABASE_URL is missing
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(ZodError);
  });

  it('should throw if WORDPRESS_API_BASE_URL is not a valid URL', () => {
    const invalidEnv = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'not-a-valid-url',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(ZodError);
    try {
      validateEnv(invalidEnv);
    } catch (e: any) {
      expect(e.issues[0].message).toContain('WORDPRESS_API_BASE_URL must be a valid URL');
    }
  });

  it('should default PORT to 3000 if not provided', () => {
    const envWithoutPort = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    const parsed = validateEnv(envWithoutPort);
    expect(parsed.PORT).toBe('3000');
  });

  it('should default PUSH_NOTIFICATIONS_ENABLED to false', () => {
    const envWithoutPushFlag = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    const parsed = validateEnv(envWithoutPushFlag);
    expect(parsed.PUSH_NOTIFICATIONS_ENABLED).toBe(false);
  });

  it('should require EXPO_ACCESS_TOKEN when production push notifications are enabled', () => {
    const invalidEnv = {
      WORKOS_API_KEY: 'sk_test_123',
      WORKOS_CLIENT_ID: 'client_123',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super-secret',
      JWT_REFRESH_SECRET: 'super-refresh-secret',
      PUSH_NOTIFICATIONS_ENABLED: 'true',
      NODE_ENV: 'production',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(ZodError);
  });
});
