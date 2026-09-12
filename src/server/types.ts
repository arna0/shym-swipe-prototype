import { ProblemReport, ProblemCategory, District, ReportStatus, SwipeType, SwipeAction, EKCStatus } from '../types';

export interface FeedQueryParams {
  userId: string;
  lat: number;
  lon: number;
  radiusKm?: number;
  category?: ProblemCategory;
  district?: District;
  limit?: number;
  offset?: number;
}

export interface RankingScoreBreakdown {
  finalScore: number;
  distanceKm: number;
  distanceScore: number; // 0..10
  categoryWeight: number; // e.g. 1.50 for ZHKH
  criticalityBaseScore: number; // based on criticalityIndex
  communityUrgencyScore: number; // based on right swipes count & ratio
  freshnessScore: number; // time-decay score
  localResidentBonus: number; // bonus if report is in user's home district
}

export interface FeedProblemItem extends ProblemReport {
  distanceKm: number;
  rankingScore: number;
  scoreBreakdown: RankingScoreBreakdown;
  isWithinRadius: boolean;
}

export interface FeedResponse {
  success: boolean;
  meta: {
    totalAvailable: number;
    returnedCount: number;
    radiusKm: number;
    userLocation: {
      latitude: number;
      longitude: number;
      nearestLandmark?: string;
    };
    algorithm: {
      name: string;
      version: string;
      maxRadiusKm: number;
      weights: {
        categoryMultiplierMax: number;
        freshnessHalfLifeHours: number;
        communityVoteWeight: number;
        proximityWeight: number;
      };
    };
    executionTimeMs: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  data: FeedProblemItem[];
}

export interface SwipeRequestDto {
  userId: string;
  problemId: string;
  swipeType: SwipeType;
}

export interface EKC109DispatchPayload {
  ticketId: string;
  sourceSystem: 'SHYMKENT_SWIPE_OPEN_API';
  status: EKCStatus;
  priority: 'CRITICAL_HOT_INCIDENT' | 'HIGH' | 'NORMAL';
  assignedDepartment: string;
  contractor: string;
  estimatedSlaHours: number;
  dispatchedAt: string;
  problemSummary: {
    id: string;
    title: string;
    description: string;
    category: ProblemCategory;
    district: District;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    osmPlaceId?: string | null;
    photoUrls: string[];
  };
  communityValidation: {
    thresholdPassed: number;
    totalRightSwipes: number;
    totalLeftSwipes: number;
    totalVolunteerOffers: number;
    criticalityScore: number;
    localCitizenRatioPercent: number;
  };
}

export interface SwipeResponseDto {
  success: boolean;
  message: string;
  data: {
    swipe: SwipeAction;
    problem: {
      id: string;
      title: string;
      status: ReportStatus;
      isHotIncident: boolean;
      criticalityIndex: number;
      swipeRightCount: number;
      swipeLeftCount: number;
      swipeUpCount: number;
      totalViews: number;
      ekc109TicketId?: string | null;
      ekc109Status: EKCStatus;
      ekc109Dispatch?: EKC109DispatchPayload | null;
    };
    user: {
      id: string;
      fullName: string;
      xp: number;
      earnedXp: number;
      level: number;
      levelTitleRu: string;
      levelTitleKz: string;
      xpToNextLevel: number;
      progressPercent: number;
      leveledUp: boolean;
      swipesCount: number;
      streakDays: number;
    };
    escalation: {
      thresholdReached: boolean;
      currentRightSwipes: number;
      thresholdTarget: number;
      reason?: string;
    };
  };
}
