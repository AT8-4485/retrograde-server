"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.validateEnv = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    WORKOS_API_KEY: zod_1.z.string().min(1, "WORKOS_API_KEY is required"),
    WORKOS_CLIENT_ID: zod_1.z.string().min(1, "WORKOS_CLIENT_ID is required"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, "JWT_REFRESH_SECRET is required"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    WORDPRESS_API_BASE_URL: zod_1.z.string().url("WORDPRESS_API_BASE_URL must be a valid URL"),
    REDIS_URL: zod_1.z.string().url("REDIS_URL must be a valid Redis URL"),
    EXPO_ACCESS_TOKEN: zod_1.z.string().optional(),
    POSTHOG_PROJECT_TOKEN: zod_1.z.string().optional(),
    POSTHOG_HOST: zod_1.z.string().url().default("https://us.i.posthog.com"),
    PUSH_NOTIFICATIONS_ENABLED: zod_1.z.enum(['true', 'false']).optional().default('false').transform(value => value === 'true'),
    PORT: zod_1.z.string().optional().default("3000"),
    NODE_ENV: zod_1.z.enum(['dev', 'test', 'production']).default('dev'),
}).superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.PUSH_NOTIFICATIONS_ENABLED && !env.EXPO_ACCESS_TOKEN) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['EXPO_ACCESS_TOKEN'],
            message: 'EXPO_ACCESS_TOKEN is required when production push notifications are enabled',
        });
    }
});
const validateEnv = (env) => {
    return envSchema.parse(env);
};
exports.validateEnv = validateEnv;
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
exports.config = parsedEnv.success ? parsedEnv.data : {};
