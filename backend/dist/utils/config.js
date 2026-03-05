"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    GOOGLE_APPLICATION_CREDENTIALS: zod_1.z.string().min(1, "GOOGLE_APPLICATION_CREDENTIALS is required"),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    WORDPRESS_API_BASE_URL: zod_1.z.string().url("WORDPRESS_API_BASE_URL must be a valid URL"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    EXPO_ACCESS_TOKEN: zod_1.z.string().min(1, "EXPO_ACCESS_TOKEN is required"),
    PORT: zod_1.z.string().optional().default("3000"),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("❌ Invalid environment variables:");
    parsedEnv.error.issues.forEach(issue => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}
exports.config = parsedEnv.data;
