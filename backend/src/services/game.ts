import { db } from '../utils/db';
import { v7 as uuidv7 } from 'uuid';
import { Game, Challenge, GameResult, UserGameStats } from '@prisma/client';

export const getGames = async (): Promise<Game[]> => {
  return db.game.findMany({
    where: { active: true }
  });
};

export const getTodayChallenge = async (gameId: string): Promise<Challenge | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.challenge.findFirst({
    where: {
      gameId,
      date: today
    }
  });
};

export const submitGameResult = async (
  userId: string | null,
  gameId: string,
  data: {
    score: number;
    maxScore: number;
    durationMs: number;
    answers: any;
  }
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Find or create today's challenge (for testing, we might need to ensure it exists)
  let challenge = await db.challenge.findUnique({
    where: { date: today }
  });

  if (!challenge) {
    // Fallback/Auto-creation for dev if not seeded
    challenge = await db.challenge.create({
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
    const stats = await db.userGameStats.findUnique({
      where: { userId_gameId: { userId, gameId } }
    });

    if (!stats || data.score > stats.bestScore) {
      isPersonalBest = true;
    }
  }

  // 3. Create the result
  const resultId = uuidv7();
  const result = await db.gameResult.create({
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
    await db.userGameStats.upsert({
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
  const totalResults = await db.gameResult.count({
    where: { challengeId: challenge.id }
  });

  const betterResults = await db.gameResult.count({
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
  return db.gameResult.update({
    where: { id: resultId },
    data: { rank, percentile }
  });
};

export const getLeaderboard = async (
  gameId: string,
  period: 'daily' | 'weekly' | 'alltime' = 'daily',
  userId?: string
) => {
  const where: any = { gameId };

  if (period === 'daily') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  } else if (period === 'weekly') {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    where.createdAt = { gte: lastWeek };
  }

  const results = await db.gameResult.findMany({
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
    userEntry = await db.gameResult.findFirst({
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
