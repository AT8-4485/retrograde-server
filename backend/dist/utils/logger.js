"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const uuid_1 = require("uuid");
const isDev = process.env.NODE_ENV !== 'production';
// Base logger instance
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    ...(isDev && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
            },
        },
    }),
});
// Middleware to inject request ID and create a child logger for the request
const requestLogger = (req, res, next) => {
    const reqId = (0, uuid_1.v7)();
    // Attach child logger to the request object so routes/services can use it
    req.log = exports.logger.child({ reqId });
    req.log.info({ method: req.method, url: req.originalUrl }, 'Incoming Request');
    res.on('finish', () => {
        req.log.info({
            statusCode: res.statusCode,
            method: req.method,
            url: req.originalUrl
        }, 'Request Completed');
    });
    next();
};
exports.requestLogger = requestLogger;
