import { Request, Response } from 'express';
import { dbRepository } from '../db/repository';
import { ProblemCategory } from '../../types';

// Critical keywords dictionary for rule-based prioritization (Russian & Kazakh)
const CRITICAL_KEYWORDS_URGENCY_10 = [
  'запах газа', 'утечка газа', 'газ иісі', 'открытый люк', 'ашық люк',
  'провал грунта', 'обвал дороги', 'оголенный провод', 'искрит провод',
  'обрушение', 'угроза жизни', 'фонтан кипятка', 'топит подстанцию', 'удар током'
];

const CRITICAL_KEYWORDS_URGENCY_9 = [
  'прорыв трубы', 'құбыр жарылды', 'нет воды во всем районе', 'нет света',
  'светофор не работает', 'бағдаршам істемейді', 'дети могут упасть',
  'размыло асфальт', 'сорвало крышу', 'упало дерево на машину', 'порыв теплотрассы'
];

const HIGH_KEYWORDS_URGENCY_7_8 = [
  'глубокая яма', 'үлкен шұңқыр', 'стихийная свалка', 'засор канализации',
  'кәріз бітелді', 'нет уличного освещения', 'жарық жоқ', 'разбита остановка',
  'не убран мусор', 'қоқыс шығарылмаған', 'порыв водопровода'
];

const MEDIUM_KEYWORDS_URGENCY_4_6 = [
  'трещина в асфальте', 'стерта разметка', 'сломана скамейка', 'урна переполнена',
  'не скошена трава', 'граффити', 'нет пандуса', 'бордюр сломан'
];

/**
 * Calculates distance in meters using Haversine formula
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Evaluates urgency index (1-10) using rule-based keywords and category heuristics
 */
export function evaluateUrgency(text: string, category: ProblemCategory): { urgency: number; matchedKeywords: string[] } {
  const lowered = text.toLowerCase();
  const matchedKeywords: string[] = [];

  // Urgency 10
  for (const kw of CRITICAL_KEYWORDS_URGENCY_10) {
    if (lowered.includes(kw)) matchedKeywords.push(kw);
  }
  if (matchedKeywords.length > 0) return { urgency: 10, matchedKeywords };

  // Urgency 9
  for (const kw of CRITICAL_KEYWORDS_URGENCY_9) {
    if (lowered.includes(kw)) matchedKeywords.push(kw);
  }
  if (matchedKeywords.length > 0) return { urgency: 9, matchedKeywords };

  // Urgency 7-8
  for (const kw of HIGH_KEYWORDS_URGENCY_7_8) {
    if (lowered.includes(kw)) matchedKeywords.push(kw);
  }
  if (matchedKeywords.length > 0) return { urgency: 8, matchedKeywords };

  // Urgency 4-6
  for (const kw of MEDIUM_KEYWORDS_URGENCY_4_6) {
    if (lowered.includes(kw)) matchedKeywords.push(kw);
  }
  if (matchedKeywords.length > 0) return { urgency: 5, matchedKeywords };

  const categoryBase: Record<string, number> = {
    SAFETY: 7,
    ZHKH: 6,
    ROADS: 5,
    TRANSPORT: 5,
    ECOLOGY: 4,
    LANDSCAPING: 3,
    ACCESSIBILITY: 4,
  };

  return { urgency: categoryBase[category] || 4, matchedKeywords: [] };
}

export class AiController {
  /**
   * POST /api/ai/analyze-complaint
   * Checks for duplicates within 30m radius in past 48 hours and calculates urgency score (1-10).
   */
  public async analyzeComplaint(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, latitude, longitude } = req.body;

      if (!title || typeof latitude !== 'number' || typeof longitude !== 'number') {
        res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Требуются title, category, latitude и longitude.',
        });
        return;
      }

      const fullText = `${title} ${description || ''}`;
      const { urgency, matchedKeywords } = evaluateUrgency(fullText, category as ProblemCategory);

      // Check for duplicates in DB within 30 meters
      const allProblems = dbRepository.getAllActiveProblems();
      const now = new Date().getTime();
      const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;

      let isDuplicate = false;
      let duplicateIncidentId: string | null = null;
      let duplicateTitle: string | null = null;
      let distanceMeters: number | null = null;

      for (const prob of allProblems) {
        const probTime = new Date(prob.createdAt).getTime();
        if (probTime >= fortyEightHoursAgo && prob.category === category) {
          const d = calculateDistanceMeters(latitude, longitude, prob.latitude, prob.longitude);
          if (d <= 30.0) {
            isDuplicate = true;
            duplicateIncidentId = prob.id;
            duplicateTitle = prob.title;
            distanceMeters = d;
            // Bump swipe count on existing incident to aggregate crowd voice
            prob.swipeRightCount += 1;
            break;
          }
        }
      }

      const escalateTo109 = urgency >= 8 || isDuplicate;

      let recommendedAction = 'ШТАТНЫЙ РЕЖИМ: Стандартное голосование горожан в приложении.';
      if (isDuplicate) {
        recommendedAction = `Объединить с существующей заявкой #${duplicateIncidentId}. Дополнительный голос добавлен к рейтингу важности.`;
      } else if (urgency >= 9) {
        recommendedAction = 'КРИТИЧЕСКИЙ ПРИОРИТЕТ: Немедленная передача в ЕКЦ 109 и оповещение оперативной бригады.';
      } else if (urgency >= 7) {
        recommendedAction = 'ВЫСОКИЙ ПРИОРИТЕТ: Поместить на первые позиции гео-ленты свайпов района.';
      }

      res.status(200).json({
        success: true,
        data: {
          is_duplicate: isDuplicate,
          duplicate_incident_id: duplicateIncidentId,
          duplicate_title: duplicateTitle,
          distance_meters: distanceMeters,
          urgency_index: urgency,
          detected_keywords: matchedKeywords,
          escalate_to_109: escalateTo109,
          recommended_action: recommendedAction,
          meta: {
            radius_checked_meters: 30,
            timeframe_hours: 48,
            engine: 'FastAPI + Rule-based Shymkent NLP',
          },
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  }
}

export const aiController = new AiController();
