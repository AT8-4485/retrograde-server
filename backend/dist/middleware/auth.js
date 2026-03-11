"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../utils/config");
const errorHandler_1 = require("./errorHandler");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errorHandler_1.ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Missing or invalid Authorization header'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new errorHandler_1.ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Access token expired'));
        }
        return next(new errorHandler_1.ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid access token'));
    }
};
exports.requireAuth = requireAuth;
