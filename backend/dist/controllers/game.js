"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.submitResult = exports.getTodayChallenge = exports.listGames = void 0;
const gameService = __importStar(require("../services/game"));
const posthog_1 = require("../utils/posthog");
const listGames = async (req, res, next) => {
    try {
        const games = await gameService.getGames();
        res.json({ data: games });
    }
    catch (error) {
        next(error);
    }
};
exports.listGames = listGames;
const getTodayChallenge = async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        const challenge = await gameService.getTodayChallenge(gameId);
        res.json(challenge);
    }
    catch (error) {
        next(error);
    }
};
exports.getTodayChallenge = getTodayChallenge;
const submitResult = async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        const userId = req.user?.id || null;
        const result = await gameService.submitGameResult(userId, gameId, req.body);
        // PostHog Instrumentation
        const distinctId = req.headers['x-posthog-distinct-id'];
        const sessionId = req.headers['x-posthog-session-id'];
        const trackingId = userId || distinctId || 'anonymous';
        posthog_1.posthog.capture({
            distinctId: trackingId,
            event: 'game_result_submitted_server',
            properties: {
                $session_id: sessionId,
                gameId: gameId,
                score: result.score,
                durationMs: result.durationMs,
                isPersonalBest: result.isPersonalBest,
                rank: result.rank,
                percentile: result.percentile,
                authenticated: !!userId
            }
        });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.submitResult = submitResult;
const getLeaderboard = async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        const period = req.query.period || 'daily';
        const userId = req.user?.id;
        const leaderboard = await gameService.getLeaderboard(gameId, period, userId);
        res.json(leaderboard);
    }
    catch (error) {
        next(error);
    }
};
exports.getLeaderboard = getLeaderboard;
