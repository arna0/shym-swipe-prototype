import { Request, Response } from 'express';
import { dbRepository } from '../db/repository';
import { SHYMKENT_REALISTIC_PRESETS } from '../data/syntheticData';
import { ProblemReport, EKCStatus } from '../../types';

export class SeedController {
  /**
   * POST /api/demo/seed
   * Injects 50 realistic problems across all 5 districts of Shymkent
   */
  public async seedDemoData(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      let seededCount = 0;

      for (let i = 0; i < SHYMKENT_REALISTIC_PRESETS.length; i++) {
        const item = SHYMKENT_REALISTIC_PRESETS[i];
        const id = `rep-shym-demo-${String(i + 1).padStart(3, '0')}`;
        const createdDate = new Date(now.getTime() - (50 - i) * 3600 * 1000 * 2.5).toISOString();

        const problem: ProblemReport = {
          id,
          title: item.title,
          description: item.description,
          category: item.category,
          district: item.district,
          latitude: item.lat,
          longitude: item.lon,
          address: item.address,
          osmPlaceId: `osm-${item.lat}-${item.lon}`,
          photoUrls: [item.photoUrl],
          resolutionPhotoUrls: item.status === 'RESOLVED' ? ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'] : [],
          status: item.status,
          criticalityIndex: item.criticality,
          swipeRightCount: item.swipesRight,
          swipeLeftCount: item.swipesLeft,
          swipeUpCount: item.swipesUp,
          totalViews: item.swipesRight + item.swipesLeft + item.swipesUp + 15,
          ekc109TicketId: item.criticality >= 8.0 ? `EKC-109-2026-0818-${String(i + 100).padStart(3, '0')}` : null,
          ekc109Status: item.criticality >= 8.0 ? EKCStatus.SYNCED : EKCStatus.PENDING_SYNC,
          ekc109SyncedAt: item.criticality >= 8.0 ? createdDate : null,
          ekc109ResponseText: item.criticality >= 8.0 ? 'Заявка принята в работу ЕКЦ 109, подрядная организация оповещена.' : null,
          authorId: `usr-shym-${String((i % 5) + 1).padStart(3, '0')}`,
          authorName: item.authorName,
          createdAt: createdDate,
          updatedAt: createdDate,
        };

        dbRepository.addOrUpdateProblem(problem);
        seededCount++;
      }

      // Also ensure district analytics are updated
      dbRepository.recalculateDistrictAnalytics();

      res.status(200).json({
        success: true,
        message: `Успешно загружено ${seededCount} реалистичных городских проблем по 5 районам Шымкента для демонстрации жюри хакатона!`,
        count: seededCount,
        districtsCovered: ['ABAY', 'AL_FARABI', 'ENBEKSHI', 'KARATAU', 'TURAN'],
        categoriesCovered: ['ZHKH', 'ROADS', 'ECOLOGY', 'SAFETY', 'TRANSPORT', 'LANDSCAPING', 'ACCESSIBILITY'],
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }
}

export const seedController = new SeedController();
