import { Request, Response } from 'express';
import { SwipeType } from '../../types';
import { swipeService } from '../services/swipeService';
import { SwipeRequestDto } from '../types';

export class SwipeController {
  /**
   * POST /api/swipe
   * Handles user swipe action, awards XP, recalculates criticality, and triggers EKC 109 escalation.
   */
  public async handleSwipe(req: Request, res: Response): Promise<void> {
    try {
      const { userId, problemId, swipeType } = req.body as Partial<SwipeRequestDto>;

      // 1. Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Параметр "userId" обязателен и должен быть непустой строкой.',
        });
        return;
      }

      // 2. Validate problemId
      if (!problemId || typeof problemId !== 'string' || problemId.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Параметр "problemId" обязателен и должен быть непустой строкой.',
        });
        return;
      }

      // 3. Validate swipeType enum
      const validTypes = Object.values(SwipeType);
      if (!swipeType || !validTypes.includes(swipeType as SwipeType)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SWIPE_TYPE',
          message: `Недопустимый тип свайпа "${swipeType}". Разрешенные значения: ${validTypes.join(', ')}`,
        });
        return;
      }

      // 4. Process swipe via service
      const result = await swipeService.processSwipe({
        userId: userId.trim(),
        problemId: problemId.trim(),
        swipeType: swipeType as SwipeType,
      });

      res.status(200).json(result);
    } catch (error: any) {
      const errorMessage = error?.message || 'Внутренняя ошибка при обработке свайпа';
      const isDuplicate = errorMessage.includes('уже проголосовали');
      const isNotFound = errorMessage.includes('не найден');

      const statusCode = isDuplicate ? 409 : isNotFound ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: isDuplicate ? 'DUPLICATE_SWIPE' : isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: errorMessage,
      });
    }
  }
}

export const swipeController = new SwipeController();
