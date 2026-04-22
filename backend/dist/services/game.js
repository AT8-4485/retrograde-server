"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.submitGameResult = exports.getTodayChallenge = exports.getGames = void 0;
const db_1 = require("../utils/db");
const uuid_1 = require("uuid");
const getGames = async () => {
    return db_1.db.game.findMany({
        where: { active: true }
    });
};
exports.getGames = getGames;
const getTodayChallenge = async (gameId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return db_1.db.challenge.findFirst({
        where: {
            gameId,
            date: today
        }
    });
};
exports.getTodayChallenge = getTodayChallenge;
const submitGameResult = async (userId, gameId, data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 1. Find or create today's challenge (for testing, we might need to ensure it exists)
    let challenge = await db_1.db.challenge.findUnique({
        where: { date: today }
    });
    if (!challenge) {
        // Fallback/Auto-creation for dev if not seeded
        challenge = await db_1.db.challenge.create({
            data: {
                id: `${gameId}-${today.toISOString().split('T')[0]}`,
                gameId,
                date: today
            }
        });
    }
    // 2. Check for Personal Best if authenticated
    let isPersonalBest = false;
    if (userId) {
        const stats = await db_1.db.userGameStats.findUnique({
            where: { userId_gameId: { userId, gameId } }
        });
        if (!stats || data.score > stats.bestScore) {
            isPersonalBest = true;
        }
    }
    // 3. Create the result
    const resultId = (0, uuid_1.v7)();
    const result = await db_1.db.gameResult.create({
        data: {
            id: resultId,
            challengeId: challenge.id,
            gameId,
            userId,
            score: data.score,
            maxScore: data.maxScore,
            durationMs: data.durationMs,
            answers: data.answers,
            isPersonalBest
        }
    });
    // 4. Update stats if authenticated
    if (userId) {
        await db_1.db.userGameStats.upsert({
            where: { userId_gameId: { userId, gameId } },
            update: {
                gamesPlayed: { increment: 1 },
                bestScore: isPersonalBest ? data.score : undefined,
                totalDurationMs: { increment: BigInt(data.durationMs) },
                lastPlayedAt: new Date(),
                // Streak logic would go here, simplified for now
            },
            create: {
                userId,
                gameId,
                gamesPlayed: 1,
                bestScore: data.score,
                totalDurationMs: BigInt(data.durationMs),
                lastPlayedAt: new Date(),
                currentStreak: 1,
                maxStreak: 1
            }
        });
    }
    // 5. Compute Rank and Percentile (Simplified for MVP)
    // In a real production app, this would be a background job or a more efficient query
    const totalResults = await db_1.db.gameResult.count({
        where: { challengeId: challenge.id }
    });
    const betterResults = await db_1.db.gameResult.count({
        where: {
            challengeId: challenge.id,
            OR: [
                { score: { gt: data.score } },
                { AND: [{ score: data.score }, { durationMs: { lt: data.durationMs } }] }
            ]
        }
    });
    const rank = betterResults + 1;
    const percentile = totalResults > 0 ? ((totalResults - rank) / totalResults) * 100 : 100;
    // Update result with rank/percentile
    return db_1.db.gameResult.update({
        where: { id: resultId },
        data: { rank, percentile }
    });
};
exports.submitGameResult = submitGameResult;
const getLeaderboard = async (gameId, period = 'daily', userId) => {
    const where = { gameId };
    if (period === 'daily') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        where.createdAt = { gte: today };
    }
    else if (period === 'weekly') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        where.createdAt = { gte: lastWeek };
    }
    const results = await db_1.db.gameResult.findMany({
        where,
        orderBy: [
            { score: 'desc' },
            { durationMs: 'asc' }
        ],
        take: 50,
        include: {
            user: {
                select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true
                }
            }
        }
    });
    let userEntry = null;
    if (userId) {
        userEntry = await db_1.db.gameResult.findFirst({
            where: { ...where, userId },
            orderBy: [
                { score: 'desc' },
                { durationMs: 'asc' }
            ]
        });
    }
    return {
        data: results,
        userEntry,
        hasMore: false
    };
};
exports.getLeaderboard = getLeaderboard;
