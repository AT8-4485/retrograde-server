"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const feed_1 = __importDefault(require("./routes/feed"));
const auth_1 = __importDefault(require("./routes/auth"));
const bookmarks_1 = __importDefault(require("./routes/bookmarks"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const games_1 = __importDefault(require("./routes/games"));
const app = (0, express_1.default)();
// Security and utility middleware
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '5mb' }));
// Utilize our Pino structured logger to attach a UUID and track requests
app.use(logger_1.requestLogger);
// Note: Morgan can be kept for simple console development logs, but Pino is the source of truth.
// We can omit Morgan since requestLogger now handles basic request lifecycle logs.
// Mount routes
app.use('/v1/feed', rateLimiter_1.publicLimiter, feed_1.default);
app.use('/v1/auth', auth_1.default);
app.use('/v1/bookmarks', bookmarks_1.default);
app.use('/v1/notifications', notifications_1.default);
app.use('/v1/games', games_1.default);
// Global Error Handler (must be registered last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
