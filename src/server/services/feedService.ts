import { ProblemReport, ProblemCategory, District } from '../../types';
import { dbRepository } from '../db/repository';
import { FeedQueryParams, FeedProblemItem, FeedResponse, RankingScoreBreakdown } from '../types';

export const EARTH_RADIUS_KM = 6371.0;
export const DEFAULT_RADIUS_KM = 7.0;
export const DEFAULT_LIMIT = 20;

// Category urgency weights (Higher priority for hazardous utilities and safety)
export const CATEGORY_WEIGHTS: Record<ProblemCategory, number> = {
  [ProblemCategory.ZHKH]: 1.50, // Аварийные коммунальные сети, порывы труб, газ, отопление
  [ProblemCategory.SAFETY]: 1.45, // Открытые колодцы, оголенные провода, аварийный свет
  [ProblemCategory.ROADS]: 1.30, // Глубокие ямы на магистралях, провалы асфальта
  [ProblemCategory.ECOLOGY]: 1.15, // Стихийные свалки, сбросы в реки Бадам/Кошкарата
  [ProblemCategory.TRANSPORT]: 1.10, // Остановки, светофоры, общественный транспорт
  [ProblemCategory.ACCESSIBILITY]: 1.05, // Пандусы, доступная среда
  [ProblemCategory.LANDSCAPING]: 1.00, // Детские площадки, скамейки, парки
};

/**
 * Calculates the Great-Circle distance between two points on Earth using the Haversine formula.
 *
 * @param lat1 User latitude in degrees
 * @param lon1 User longitude in degrees
 * @param lat2 Problem latitude in degrees
 * @param lon2 Problem longitude in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates a bounding box around the user coordinates for indexed SQL pre-filtering.
 * In PostgreSQL with PostGIS or B-Tree:
 *   WHERE latitude BETWEEN minLat AND maxLat
 *     AND longitude BETWEEN minLon AND maxLon
 */
export function getBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lonDelta =
    ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)) /
    Math.cos((centerLat * Math.PI) / 180);

  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta,
  };
}

/**
 * Smart Ranking Algorithm for Shymkent Swipe Feed
 *
 * Factors:
 * 1. Category Urgency Multiplier (W_cat: 1.00 - 1.50)
 * 2. Distance Proximity Boost (S_dist: 0 - 10)
 * 3. Freshness / Time Decay Half-Life (S_fresh: 0 - 10, half-life 48h)
 * 4. Community Vote Urgency & Right-Swipe Ratio (S_votes: 0 - 10)
 * 5. Local Resident District Multiplier (+15% if in user's home district)
 */
export function calculateRankingScore(
  problem: ProblemReport,
  distanceKm: number,
  maxRadiusKm: number,
  userDistrict?: District
): RankingScoreBreakdown {
  // 1. Category Multiplier
  const categoryWeight = CATEGORY_WEIGHTS[problem.category] || 1.0;

  // 2. Distance Proximity Score (Closer problems score closer to 10)
  const normalizedDist = Math.min(1.0, Math.max(0.0, distanceKm / maxRadiusKm));
  const distanceScore = Number((10.0 * (1.0 - normalizedDist)).toFixed(2));

  // 3. Freshness / Time Decay Score (Exponential decay)
  const now = Date.now();
  const createdTime = new Date(problem.createdAt).getTime();
  const hoursElapsed = Math.max(0.1, (now - createdTime) / (1000 * 60 * 60));
  // 48 hours half-life
  const freshnessScore = Number((10.0 * Math.exp(-hoursElapsed / 48)).toFixed(2));

  // 4. Community Urgency & Right Swipes Ratio
  const rightVotes = problem.swipeRightCount || 0;
  const leftVotes = problem.swipeLeftCount || 0;
  const totalVotes = rightVotes + leftVotes;
  const approvalRatio = totalVotes > 0 ? (rightVotes + 1) / (totalVotes + 1) : 0.5;
  const logVolume = Math.min(5.0, Math.log10(1 + rightVotes) * 2.0);
  const communityUrgencyScore = Number((logVolume * approvalRatio * 2.0).toFixed(2));

  // 5. Criticality Base
  const criticalityBaseScore = problem.criticalityIndex || 5.0;

  // 6. Local Resident Bonus (+15% if this issue is in the user's home district)
  const isLocal = userDistrict && problem.district === userDistrict;
  const localResidentBonus = isLocal ? 1.15 : 1.0;

  // Combined Mathematical Score (0 .. 100 scale)
  // Weighted combination
  const rawScore =
    (criticalityBaseScore * categoryWeight * 3.5) +
    (distanceScore * 2.5) +
    (freshnessScore * 2.0) +
    (communityUrgencyScore * 2.0);

  const finalScore = Number((rawScore * localResidentBonus).toFixed(2));

  return {
    finalScore,
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceScore,
    categoryWeight,
    criticalityBaseScore,
    communityUrgencyScore,
    freshnessScore,
    localResidentBonus,
  };
}

export class FeedService {
  /**
   * Generates a personalized swipe feed for a user based on their current GPS coordinates.
   */
  public async getPersonalizedFeed(params: FeedQueryParams): Promise<FeedResponse> {
    const startTime = performance.now();

    const {
      userId,
      lat,
      lon,
      radiusKm = DEFAULT_RADIUS_KM,
      category,
      district,
      limit = DEFAULT_LIMIT,
      offset = 0,
    } = params;

    // 1. Fetch user data (for local district boost & profile verification)
    const user = dbRepository.getUserById(userId);
    const userDistrict = user?.district;

    // 2. Fetch already-swiped problem IDs to exclude them from the feed
    const swipedProblemIds = dbRepository.getSwipedProblemIdsByUser(userId);

    // 3. Fetch all active candidate problems
    const allActiveProblems = dbRepository.getAllActiveProblems();

    // 4. Filter and score candidate problems
    const candidateItems: FeedProblemItem[] = [];

    for (const problem of allActiveProblems) {
      // Step A: Exclude already swiped problems (Business rule)
      if (swipedProblemIds.has(problem.id)) {
        continue;
      }

      // Step B: Optional category & district filters
      if (category && problem.category !== category) {
        continue;
      }
      if (district && problem.district !== district) {
        continue;
      }

      // Step C: Haversine distance calculation
      const distanceKm = calculateHaversineDistance(
        lat,
        lon,
        problem.latitude,
        problem.longitude
      );

      const isWithinRadius = distanceKm <= radiusKm;

      // Step D: Filter within radius
      if (!isWithinRadius) {
        continue;
      }

      // Step E: Smart Ranking calculation
      const scoreBreakdown = calculateRankingScore(
        problem,
        distanceKm,
        radiusKm,
        userDistrict
      );

      candidateItems.push({
        ...problem,
        distanceKm: scoreBreakdown.distanceKm,
        rankingScore: scoreBreakdown.finalScore,
        scoreBreakdown,
        isWithinRadius: true,
      });
    }

    // 5. Sort candidates by rankingScore descending (highest priority first)
    candidateItems.sort((a, b) => b.rankingScore - a.rankingScore);

    // 6. Apply pagination (limit & offset)
    const totalAvailable = candidateItems.length;
    const paginatedItems = candidateItems.slice(offset, offset + limit);

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      success: true,
      meta: {
        totalAvailable,
        returnedCount: paginatedItems.length,
        radiusKm,
        userLocation: {
          latitude: lat,
          longitude: lon,
        },
        algorithm: {
          name: 'ShymkentSmartGeoRanking',
          version: '2.4.0',
          maxRadiusKm: radiusKm,
          weights: {
            categoryMultiplierMax: 1.50,
            freshnessHalfLifeHours: 48,
            communityVoteWeight: 2.0,
            proximityWeight: 2.5,
          },
        },
        executionTimeMs,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalAvailable,
        },
      },
      data: paginatedItems,
    };
  }
}

export const feedService = new FeedService();
