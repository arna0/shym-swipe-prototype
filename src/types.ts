// ==============================================================================
// 🏛️ TypeScript Type Definitions mirroring the Prisma PostgreSQL Schema
// ==============================================================================

export enum Role {
  CITIZEN = 'CITIZEN',
  VOLUNTEER = 'VOLUNTEER',
  INSPECTOR = 'INSPECTOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum District {
  ABAY = 'ABAY',
  AL_FARABI = 'AL_FARABI',
  ENBEKSHI = 'ENBEKSHI',
  KARATAU = 'KARATAU',
  TURAN = 'TURAN',
}

export const DISTRICT_LABELS: Record<District, { ru: string; kz: string; center: [number, number]; desc: string }> = {
  [District.ABAY]: {
    ru: 'Абайский район',
    kz: 'Абай ауданы',
    center: [42.3155, 69.5822],
    desc: 'Западная и центральная часть, исторические микрорайоны',
  },
  [District.AL_FARABI]: {
    ru: 'Аль-Фарабийский район',
    kz: 'Әл-Фараби ауданы',
    center: [42.3218, 69.5968],
    desc: 'Административный и культурный центр, пр. Тауке Хана',
  },
  [District.ENBEKSHI]: {
    ru: 'Енбекшинский район',
    kz: 'Еңбекші ауданы',
    center: [42.2982, 69.6310],
    desc: 'Индустриальная и восточная часть города',
  },
  [District.KARATAU]: {
    ru: 'Каратауский район',
    kz: 'Қаратау ауданы',
    center: [42.3712, 69.6234],
    desc: 'Северная часть, мкр. Нурсат, Административно-деловой центр',
  },
  [District.TURAN]: {
    ru: 'Туранский район',
    kz: 'Тұран ауданы',
    center: [42.3489, 69.5412],
    desc: 'Новый 5-й район, микрорайоны Шымкент-Сити, Туран, Акжайык',
  },
};

export enum ProblemCategory {
  ZHKH = 'ZHKH',
  ROADS = 'ROADS',
  ECOLOGY = 'ECOLOGY',
  SAFETY = 'SAFETY',
  TRANSPORT = 'TRANSPORT',
  LANDSCAPING = 'LANDSCAPING',
  ACCESSIBILITY = 'ACCESSIBILITY',
}

export const CATEGORY_METADATA: Record<
  ProblemCategory,
  { labelRu: string; labelKz: string; icon: string; color: string; badgeBg: string }
> = {
  [ProblemCategory.ZHKH]: {
    labelRu: 'ЖКХ и сети',
    labelKz: 'ТКШ және желілер',
    icon: 'Droplet',
    color: '#38bdf8',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  [ProblemCategory.ROADS]: {
    labelRu: 'Дороги и разметка',
    labelKz: 'Жолдар мен белгілер',
    icon: 'Car',
    color: '#fb923c',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  [ProblemCategory.ECOLOGY]: {
    labelRu: 'Экология и свалки',
    labelKz: 'Экология және қоқыс',
    icon: 'Leaf',
    color: '#34d399',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  [ProblemCategory.SAFETY]: {
    labelRu: 'Безопасность и свет',
    labelKz: 'Қауіпсіздік және жарық',
    icon: 'ShieldAlert',
    color: '#f87171',
    badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  [ProblemCategory.TRANSPORT]: {
    labelRu: 'Транспорт и остановки',
    labelKz: 'Көлік және аялдамалар',
    icon: 'Bus',
    color: '#a78bfa',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  [ProblemCategory.LANDSCAPING]: {
    labelRu: 'Благоустройство',
    labelKz: 'Абаттандыру',
    icon: 'Trees',
    color: '#2dd4bf',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  [ProblemCategory.ACCESSIBILITY]: {
    labelRu: 'Доступная среда',
    labelKz: 'Қолжетімді орта',
    icon: 'Accessibility',
    color: '#818cf8',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
};

export enum ReportStatus {
  NEW = 'NEW',
  VERIFIED = 'VERIFIED',
  SENT_TO_109 = 'SENT_TO_109',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  DUPLICATE = 'DUPLICATE',
}

export enum SwipeType {
  RIGHT_IMPORTANT = 'RIGHT_IMPORTANT',
  LEFT_IRRELEVANT = 'LEFT_IRRELEVANT',
  UP_VOLUNTEER = 'UP_VOLUNTEER',
}

export enum EKCStatus {
  PENDING_SYNC = 'PENDING_SYNC',
  SYNCED = 'SYNCED',
  IN_WORK_109 = 'IN_WORK_109',
  CONTRACTOR_ASSIGN = 'CONTRACTOR_ASSIGN',
  CLOSED_109 = 'CLOSED_109',
  SYNC_FAILED = 'SYNC_FAILED',
}

export interface User {
  id: string;
  telegramId?: string | null;
  telegramUsername?: string | null;
  phone?: string | null;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  district: District;
  xp: number;
  level: number;
  streakDays: number;
  reputationScore: number;
  swipesCount: number;
  reportsCount: number;
  resolvedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemReport {
  id: string;
  title: string;
  description: string;
  category: ProblemCategory;
  district: District;
  latitude: number;
  longitude: number;
  address: string;
  osmPlaceId?: string | null;
  photoUrls: string[];
  resolutionPhotoUrls?: string[];
  status: ReportStatus;
  criticalityIndex: number;
  swipeRightCount: number;
  swipeLeftCount: number;
  swipeUpCount: number;
  totalViews: number;
  ekc109TicketId?: string | null;
  ekc109Status: EKCStatus;
  ekc109SyncedAt?: string | null;
  ekc109ResponseText?: string | null;
  authorId: string;
  authorName?: string;
  inspectorId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SwipeAction {
  id: string;
  userId: string;
  problemId: string;
  swipeType: SwipeType;
  weight: number;
  isLocalUser: boolean;
  createdAt: string;
}

export interface DistrictAnalytics {
  id: string;
  district: District;
  date: string;
  totalReports: number;
  newReports: number;
  inProgressReports: number;
  resolvedReports: number;
  rejectedReports: number;
  avgResolutionTimeHours: number;
  avgCriticalityIndex: number;
  totalSwipesCount: number;
  topCategory?: ProblemCategory;
  volunteerActionsCount: number;
  activeCitizensCount: number;
  ekc109SyncRate: number;
  ekc109ResolvedRate: number;
}

export const USER_LEVEL_TITLES: Record<number, { titleKz: string; titleRu: string; minXp: number; icon: string }> = {
  1: { titleKz: 'Жаңа тұрғын', titleRu: 'Новый житель', minXp: 0, icon: 'Seedling' },
  2: { titleKz: 'Қала белсендісі', titleRu: 'Активист города', minXp: 100, icon: 'Activity' },
  3: { titleKz: 'Қала қамқоршысы', titleRu: 'Защитник города', minXp: 250, icon: 'Shield' },
  4: { titleKz: 'Қала сақшысы', titleRu: 'Городской хранитель', minXp: 400, icon: 'Crown' },
  5: { titleKz: 'Қала батыры', titleRu: 'Городской герой', minXp: 650, icon: 'Award' },
  6: { titleKz: 'Шымкент аңызы', titleRu: 'Легенда Шымкента', minXp: 1000, icon: 'Sparkles' },
};

export function getUserLevelInfo(xp: number): { level: number; titleKz: string; titleRu: string; xpForCurrentLevel: number; xpToNextLevel: number; progressPercent: number } {
  let level = 1;
  if (xp >= 1000) level = 6;
  else if (xp >= 650) level = 5;
  else if (xp >= 400) level = 4;
  else if (xp >= 250) level = 3;
  else if (xp >= 100) level = 2;
  else level = 1;

  const currentMin = USER_LEVEL_TITLES[level]?.minXp || 0;
  const nextMin = USER_LEVEL_TITLES[level + 1]?.minXp || (currentMin + 500);
  const needed = Math.max(1, nextMin - currentMin);
  const currentInLevel = Math.max(0, xp - currentMin);
  const progressPercent = Math.min(100, Math.round((currentInLevel / needed) * 100));

  return {
    level,
    titleKz: USER_LEVEL_TITLES[level]?.titleKz || 'Тұрғын',
    titleRu: USER_LEVEL_TITLES[level]?.titleRu || 'Житель',
    xpForCurrentLevel: currentMin,
    xpToNextLevel: Math.max(0, nextMin - xp),
    progressPercent,
  };
}

