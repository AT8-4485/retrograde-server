import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  WORKOS_API_KEY: z.string().min(1, "WORKOS_API_KEY is required"),
  WORKOS_CLIENT_ID: z.string().min(1, "WORKOS_CLIENT_ID is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  WORDPRESS_API_BASE_URL: z.string().url("WORDPRESS_API_BASE_URL must be a valid URL"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis URL"),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
});

export const validateEnv = (env: Record<string, any>) => {
  return envSchema.parse(env);
};

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  parsedEnv.error.issues.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  });
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

export const config = parsedEnv.success ? parsedEnv.data : {} as any;
