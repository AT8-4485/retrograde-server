"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.redisClient = void 0;
const redis_1 = require("redis");
const config_1 = require("./config");
exports.redisClient = (0, redis_1.createClient)({
    url: config_1.config.REDIS_URL
});
exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
const STD_TTL = 86400; // 24 hours
exports.cache = {
    connect: async () => {
        try {
            await exports.redisClient.connect();
            console.log('📦 Connected to Redis successfully');
        }
        catch (err) {
            console.error('⚠️ Redis connection failed, cache will fail-open:', err);
        }
    },
    quit: async () => {
        try {
            await exports.redisClient.quit();
            console.log('📦 Redis connection closed gracefully');
        }
        catch (err) {
            console.error('⚠️ Error closing Redis connection:', err);
        }
    },
    get: async (key) => {
        try {
            const data = await exports.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error(`⚠️ Redis GET error for key ${key}, failing open:`, error);
            return null;
        }
    },
    set: async (key, value, ttlSeconds = STD_TTL) => {
        try {
            await exports.redisClient.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
        }
        catch (error) {
            console.error(`⚠️ Redis SET error for key ${key}:`, error);
        }
    },
    flushAll: async () => {
        try {
            await exports.redisClient.flushAll();
        }
        catch (error) {
            console.error(`⚠️ Redis FLUSHALL error:`, error);
        }
    },
    acquireLock: async (key, ttlSeconds) => {
        try {
            // SET NX returns "OK" if set, null if it already exists
            const result = await exports.redisClient.set(key, 'locked', {
                NX: true,
                EX: ttlSeconds
            });
            return result === 'OK';
        }
        catch (error) {
            console.error(`⚠️ Redis acquireLock error for key ${key}:`, error);
            // Fail safely. If Redis is down, return false to prevent thundering herd
            return false;
        }
    }
};
