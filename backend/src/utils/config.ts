import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, "FIREBASE_SERVICE_ACCOUNT is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  WORDPRESS_API_BASE_URL: z.string().url("WORDPRESS_API_BASE_URL must be a valid URL"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  EXPO_ACCESS_TOKEN: z.string().min(1, "EXPO_ACCESS_TOKEN is required"),
  PORT: z.string().optional().default("3000"),
});

export const validateEnv = (envVars: Record<string, string | undefined>) => {
  return envSchema.parse(envVars);
};

let configData: z.infer<typeof envSchema>;

try {
  configData = validateEnv(process.env);
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.issues.forEach(issue => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    process.exit(1);
  } else {
    // In test environment, we still need configData to have a type/value even if it failed,
    // but the test suite won't run normal server anyway, or we handle it gracefully.
    // For now we just cast it so the compiler doesn't complain, tests will stub process.env
    configData = process.env as any;
  }
}

export const config = configData;
