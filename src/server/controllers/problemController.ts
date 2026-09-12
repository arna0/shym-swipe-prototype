import { Request, Response } from 'express';
import { ProblemCategory, District, DISTRICT_LABELS } from '../../types';
import { dbRepository } from '../db/repository';
import { calculateHaversineDistance } from '../services/feedService';

export class ProblemController {
  /**
   * Helper to determine nearest district in Shymkent based on GPS coordinates
   */
  private getNearestDistrict(lat: number, lon: number): District {
    let nearestDistrict = District.AL_FARABI;
    let minDistance = Infinity;

    for (const [distKey, data] of Object.entries(DISTRICT_LABELS)) {
      const [cLat, cLon] = data.center;
      const d = calculateHaversineDistance(lat, lon, cLat, cLon);
      if (d < minDistance) {
        minDistance = d;
        nearestDistrict = distKey as District;
      }
    }
    return nearestDistrict;
  }

  /**
   * POST /api/problems
   * Creates a new problem report with geolocation and photos, persists in database,
   * adds to the swipe feed, and awards +50 XP to the citizen author.
   */
  public async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category,
        district,
        latitude,
        longitude,
        address,
        osmPlaceId,
        photoUrls = [],
        authorId = 'usr-shym-001',
        authorName,
      } = req.body;

      // 1. Validate title
      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Заголовок проблемы обязателен и должен содержать не менее 5 символов.',
        });
        return;
      }

      // 2. Validate description
      if (!description || typeof description !== 'string' || description.trim().length < 10) {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Описание проблемы для диспетчера 109 обязательно и должно содержать не менее 10 символов.',
        });
        return;
      }

      // 3. Validate category
      const validCategories = Object.values(ProblemCategory);
      if (!category || !validCategories.includes(category as ProblemCategory)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_CATEGORY',
          message: `Недопустимая категория. Разрешенные значения: ${validCategories.join(', ')}`,
        });
        return;
      }

      // 4. Validate coordinates
      const parsedLat = parseFloat(latitude);
      const parsedLon = parseFloat(longitude);
      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_COORDINATES',
          message: 'Координаты широты (latitude) и долготы (longitude) обязательны и должны быть числами.',
        });
        return;
      }

      // 5. Determine District
      let finalDistrict: District;
      const validDistricts = Object.values(District);
      if (district && validDistricts.includes(district as District)) {
        finalDistrict = district as District;
      } else {
        finalDistrict = this.getNearestDistrict(parsedLat, parsedLon);
      }

      // 6. Validate address
      const finalAddress = address && typeof address === 'string' && address.trim().length > 0
        ? address.trim()
        : `г. Шымкент, ${DISTRICT_LABELS[finalDistrict].ru}, координаты ${parsedLat.toFixed(4)}, ${parsedLon.toFixed(4)}`;

      // 7. Lookup user if exists to get name
      const existingUser = dbRepository.getUserById(authorId || 'usr-shym-001');

      // 8. Create problem in DB repository
      const { problem: createdProblem, user } = dbRepository.createProblem({
        title,
        description,
        category: category as ProblemCategory,
        district: finalDistrict,
        latitude: parsedLat,
        longitude: parsedLon,
        address: finalAddress,
        osmPlaceId,
        photoUrls: Array.isArray(photoUrls) && photoUrls.length > 0 ? photoUrls : [],
        authorId: authorId || 'usr-shym-001',
        authorName: authorName || existingUser?.fullName || 'Горожанин Шымкента',
      });

      res.status(201).json({
        success: true,
        message: 'Проблема успешно зарегистрирована в системе «Шымкент Свайп» (+50 XP)! Карточка мгновенно добавлена в общую ленту свайпов.',
        data: {
          problem: createdProblem,
          user: user
            ? {
                id: user.id,
                fullName: user.fullName,
                xp: user.xp,
                earnedXp: 50,
                reportsCount: user.reportsCount,
                level: user.level,
              }
            : undefined,
          feedPlacement: {
            isAvailableInFeed: true,
            district: createdProblem.district,
            coordinates: [createdProblem.latitude, createdProblem.longitude],
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating problem:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error?.message || 'Внутренняя ошибка сервера при создании проблемы',
      });
    }
  }

  /**
   * GET /api/problems
   * Lists all problems
   */
  public async getProblems(req: Request, res: Response): Promise<void> {
    try {
      const allProblems = dbRepository.getAllProblems();
      res.status(200).json({
        success: true,
        count: allProblems.length,
        data: allProblems,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }

  /**
   * PATCH /api/problems/:id/status
   * Updates status of a problem (e.g. from Akimat / EKC 109 dispatcher)
   */
  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, resolutionPhotoUrls, notes } = req.body;

      if (!id || !status) {
        res.status(400).json({ success: false, message: 'ID и статус обязательны' });
        return;
      }

      const updated = dbRepository.updateProblemStatus(id, status, resolutionPhotoUrls, notes);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Проблема не найдена' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Статус проблемы #${id} успешно изменен на ${status}`,
        data: updated,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }
}

export const problemController = new ProblemController();
