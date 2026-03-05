import { validateEnv } from '../src/utils/config';
import { ZodError } from 'zod';

describe('Environment Variables Validation', () => {
  it('should pass validation with all required valid variables', () => {
    const validEnv = {
      FIREBASE_SERVICE_ACCOUNT: 'dummy-service-account',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      JWT_SECRET: 'super-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
      PORT: '3000',
    };

    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('should throw a ZodError if a required variable is missing', () => {
    const invalidEnv = {
      FIREBASE_SERVICE_ACCOUNT: 'dummy-service-account',
      // DATABASE_URL is missing
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      JWT_SECRET: 'super-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(ZodError);
  });

  it('should throw if WORDPRESS_API_BASE_URL is not a valid URL', () => {
    const invalidEnv = {
      FIREBASE_SERVICE_ACCOUNT: 'dummy-service-account',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'not-a-valid-url',
      JWT_SECRET: 'super-secret',
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
      FIREBASE_SERVICE_ACCOUNT: 'dummy',
      DATABASE_URL: 'file:./test.db',
      WORDPRESS_API_BASE_URL: 'http://retrograde.local',
      JWT_SECRET: 'super-secret',
      EXPO_ACCESS_TOKEN: 'expo-token',
    };

    const parsed = validateEnv(envWithoutPort);
    expect(parsed.PORT).toBe('3000');
  });
});
