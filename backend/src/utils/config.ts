import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, "FIREBASE_SERVICE_ACCOUNT is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  WORDPRESS_API_BASE_URL: z.string().url("WORDPRESS_API_BASE_URL must be a valid URL"),
  EXPO_ACCESS_TOKEN: z.string().min(1, "EXPO_ACCESS_TOKEN is required"),
  PORT: z.string().optional().default("3000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  parsedEnv.error.issues.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = parsedEnv.data;
