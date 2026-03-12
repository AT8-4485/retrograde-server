"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
// Initialize cache with a standard TTL of 24 hours (86400 seconds)
// We use a long TTL because our background poller will handle early invalidation
// if changes are detected on the WordPress side.
exports.cache = new node_cache_1.default({ stdTTL: 86400, checkperiod: 120 });
