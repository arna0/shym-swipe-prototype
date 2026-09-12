import { Request, Response } from 'express';
import { dbRepository } from '../db/repository';
import { District, getUserLevelInfo } from '../../types';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string;
  district: District;
  xp: number;
  level: number;
  levelTitle: string;
  swipesCount: number;
  reportsCount: number;
  resolvedCount: number;
  badges: Array<{ id: string; name: string; icon: string; desc: string }>;
  weeklyStreak: number;
}

export class GamificationController {
  /**
   * GET /api/gamification/leaderboard
   * Returns weekly top-10 urbanists of Shymkent
   */
  public async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const users = dbRepository.getAllUsers();
      // Sort by XP descending
      const sorted = [...users].sort((a, b) => b.xp - a.xp);

      const badgesPool = [
        { id: 'guardian', name: 'Страж Аль-Фараби', icon: 'Shield', desc: 'Более 50 проверенных заявок в центре' },
        { id: 'anti_hole', name: 'Анти-Яма 109', icon: 'Zap', desc: 'Устранено 10+ дорожных ям по инициативе' },
        { id: 'eco_hero', name: 'Зеленый Шымкент', icon: 'Leaf', desc: 'Участие в эко-патрулях реки Бадам' },
        { id: 'top_swiper', name: 'Мастер Свайпа', icon: 'Flame', desc: '100+ свайпов за 7 дней подряд' },
      ];

      const leaderboard: LeaderboardEntry[] = sorted.slice(0, 10).map((u, idx) => {
        const lvlInfo = getUserLevelInfo(u.xp);
        return {
          rank: idx + 1,
          userId: u.id,
          fullName: u.fullName,
          avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          district: u.district,
          xp: u.xp,
          level: lvlInfo.level,
          levelTitle: lvlInfo.titleRu,
          swipesCount: u.swipesCount || Math.floor(u.xp / 4),
          reportsCount: u.reportsCount || 1,
          resolvedCount: u.resolvedCount || 0,
          badges: badgesPool.slice(0, Math.min(4, Math.max(1, lvlInfo.level - 1))),
          weeklyStreak: u.streakDays || (idx === 0 ? 14 : idx === 1 ? 9 : 5),
        };
      });

      res.status(200).json({
        success: true,
        week: '2026-W34',
        period: '12 Авг – 19 Авг 2026',
        city: 'г. Шымкент',
        count: leaderboard.length,
        data: leaderboard,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }

  /**
   * POST /api/gamification/claim-streak
   * Awards daily streak XP
   */
  public async claimDailyStreak(req: Request, res: Response): Promise<void> {
    try {
      const { userId = 'usr-shym-001' } = req.body;
      const user = dbRepository.getUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.streakDays = (user.streakDays || 1) + 1;
      const bonusXp = 25 * user.streakDays;
      user.xp += bonusXp;
      user.updatedAt = new Date().toISOString();

      const lvlInfo = getUserLevelInfo(user.xp);

      res.status(200).json({
        success: true,
        message: `Серия посещений продлена до ${user.streakDays} дней! Получено +${bonusXp} XP.`,
        data: {
          streakDays: user.streakDays,
          bonusXp,
          totalXp: user.xp,
          levelInfo: lvlInfo,
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }
}

export const gamificationController = new GamificationController();
