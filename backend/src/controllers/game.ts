import { Request, Response, NextFunction } from 'express';
import * as gameService from '../services/game';
import { posthog } from '../utils/posthog';

export const listGames = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const games = await gameService.getGames();
    res.json({ data: games });
  } catch (error) {
    next(error);
  }
};

export const getTodayChallenge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.params.gameId as string;
    const challenge = await gameService.getTodayChallenge(gameId);
    res.json(challenge);
  } catch (error) {
    next(error);
  }
};

export const submitResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.params.gameId as string;
    const userId = req.user?.id || null;
    const result = await gameService.submitGameResult(userId, gameId, req.body);
    
    // PostHog Instrumentation
    const distinctId = req.headers['x-posthog-distinct-id'] as string;
    const sessionId = req.headers['x-posthog-session-id'] as string;
    
    const trackingId = userId || distinctId || 'anonymous';
    
    posthog.capture({
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
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gameId = req.params.gameId as string;
    const period = (req.query.period as 'daily' | 'weekly' | 'alltime') || 'daily';
    const userId = req.user?.id;
    
    const leaderboard = await gameService.getLeaderboard(gameId, period, userId);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
