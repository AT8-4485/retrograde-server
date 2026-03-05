"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
class ApiError extends Error {
    status;
    type;
    title;
    detail;
    constructor(status, type, title, detail) {
        super(detail);
        this.status = status;
        this.type = type;
        this.title = title;
        this.detail = detail;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ApiError = ApiError;
const errorHandler = (err, req, res, next) => {
    const instance = req.originalUrl;
    const reqLogger = req.log || logger_1.logger;
    if (err instanceof ApiError) {
        reqLogger.warn({ err: { message: err.message, stack: err.stack }, type: err.type, status: err.status }, `ApiError thrown: ${err.title}`);
        res.status(err.status).json({
            type: err.type,
            title: err.title,
            status: err.status,
            detail: err.detail,
            instance,
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const detail = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        reqLogger.warn({ err, detail }, 'Zod Validation Error');
        res.status(400).json({
            type: 'https://api.retrogradenews.app/errors/validation-error',
            title: 'Validation Error',
            status: 400,
            detail,
            instance,
        });
        return;
    }
    reqLogger.error({ err: { message: err.message, stack: err.stack }, instance }, 'Unhandled Internal Server Error');
    res.status(500).json({
        type: 'https://api.retrogradenews.app/errors/internal-server-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred while processing your request.',
        instance,
    });
};
exports.errorHandler = errorHandler;
