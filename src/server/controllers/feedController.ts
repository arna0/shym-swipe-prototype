import { Request, Response } from 'express';
import { feedService, DEFAULT_RADIUS_KM } from '../services/feedService';
import { dbRepository } from '../db/repository';
import { FeedQueryParams } from '../types';
import { ProblemCategory, District, SwipeType } from '../../types';

export class FeedController {
  /**
   * GET /api/feed
   * Generates a personalized swipe feed filtered by Haversine radius (7 km)
   * and ranked by the Smart Geo Ranking algorithm.
   */
  public async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        lat,
        lon,
        radiusKm,
        category,
        district,
        limit,
        offset,
      } = req.query;

      // 1. Validation of required parameters
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Параметр "userId" обязателен (строка ID пользователя).',
        });
        return;
      }

      if (lat === undefined || lon === undefined) {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Параметры "lat" и "lon" обязательны (GPS координаты пользователя в Шымкенте).',
        });
        return;
      }

      const parsedLat = parseFloat(lat as string);
      const parsedLon = parseFloat(lon as string);

      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_COORDINATES',
          message: 'Координаты "lat" и "lon" должны быть валидными числами с плавающей точкой.',
        });
        return;
      }

      // Check realistic bounds for coordinates (-90..90, -180..180)
      if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
        res.status(400).json({
          success: false,
          error: 'COORDINATES_OUT_OF_RANGE',
          message: 'Координаты выходят за пределы допустимых диапазонов WGS84.',
        });
        return;
      }

      // 2. Parse optional query parameters
      const parsedRadius = radiusKm ? parseFloat(radiusKm as string) : DEFAULT_RADIUS_KM;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
      const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

      const queryParams: FeedQueryParams = {
        userId: userId.trim(),
        lat: parsedLat,
        lon: parsedLon,
        radiusKm: isNaN(parsedRadius) || parsedRadius <= 0 ? DEFAULT_RADIUS_KM : parsedRadius,
        category: category && Object.values(ProblemCategory).includes(category as ProblemCategory)
          ? (category as ProblemCategory)
          : undefined,
        district: district && Object.values(District).includes(district as District)
          ? (district as District)
          : undefined,
        limit: Math.min(100, Math.max(1, isNaN(parsedLimit) ? 20 : parsedLimit)),
        offset: Math.max(0, isNaN(parsedOffset) ? 0 : parsedOffset),
      };

      // 3. Execute Feed Service
      const feedResponse = await feedService.getPersonalizedFeed(queryParams);

      res.status(200).json(feedResponse);
    } catch (error: any) {
      console.error('Error in FeedController.getFeed:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Ошибка при формировании ленты свайпов.',
        details: error?.message || String(error),
      });
    }
  }

  /**
   * POST /api/swipe
   * Records a user swipe action (Right/Left/Up) to exclude it from future feeds
   * and adjust problem criticality in real time.
   */
  public async recordSwipe(req: Request, res: Response): Promise<void> {
    try {
      const { userId, problemId, swipeType } = req.body;

      if (!userId || !problemId || !swipeType) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Поля "userId", "problemId", "swipeType" обязательны.',
        });
        return;
      }

      if (!Object.values(SwipeType).includes(swipeType)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SWIPE_TYPE',
          message: `Недопустимый swipeType. Доступны: ${Object.values(SwipeType).join(', ')}`,
        });
        return;
      }

      const problem = dbRepository.getProblemById(problemId);
      if (!problem) {
        res.status(404).json({
          success: false,
          error: 'PROBLEM_NOT_FOUND',
          message: `Проблема с ID "${problemId}" не найдена.`,
        });
        return;
      }

      const user = dbRepository.getUserById(userId);
      const isLocalUser = user ? user.district === problem.district : false;
      const weight = isLocalUser ? 1.5 : 1.0;

      const recordedAction = dbRepository.recordSwipe({
        userId,
        problemId,
        swipeType,
        weight,
        isLocalUser,
      });

      res.status(201).json({
        success: true,
        message: 'Свайп успешно зарегистрирован. Заявка исключена из персональной ленты.',
        data: {
          swipe: recordedAction,
          updatedProblem: dbRepository.getProblemById(problemId),
        },
      });
    } catch (error: any) {
      console.error('Error in FeedController.recordSwipe:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Не удалось зафиксировать свайп.',
      });
    }
  }

  /**
   * POST /api/feed/reset
   * Resets swipe history for testing purposes in the interactive explorer.
   */
  public async resetUserSwipes(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ success: false, message: 'userId обязателен.' });
        return;
      }
      dbRepository.resetUserSwipes(userId);
      res.json({
        success: true,
        message: `История свайпов для пользователя ${userId} сброшена. Все проблемы снова доступны в ленте.`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }
}

export const feedController = new FeedController();
