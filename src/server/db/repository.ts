import { ProblemReport, ProblemCategory, District, ReportStatus, EKCStatus, User, Role, SwipeAction, SwipeType } from '../../types';

// In-memory persistent database repository (also mirrors Prisma queries)
class ShymkentDataRepository {
  private users: Map<string, User> = new Map();
  private problems: Map<string, ProblemReport> = new Map();
  private swipes: SwipeAction[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial users
    const defaultUser: User = {
      id: 'usr-shym-001',
      telegramId: '492817291',
      telegramUsername: 'shymkent_patrol',
      phone: '+7 701 555 4231',
      fullName: 'Батырхан Сейдалиев',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: Role.CITIZEN,
      district: District.AL_FARABI,
      xp: 420,
      level: 4,
      streakDays: 7,
      reputationScore: 1.5,
      swipesCount: 84,
      reportsCount: 5,
      resolvedCount: 3,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-08-18T06:00:00Z',
    };
    this.users.set(defaultUser.id, defaultUser);

    // Additional test users
    const user2: User = {
      id: 'usr-shym-002',
      telegramId: '883920192',
      telegramUsername: 'aigerim_shym',
      fullName: 'Айгерим Омарова',
      role: Role.CITIZEN,
      district: District.KARATAU,
      xp: 610,
      level: 5,
      streakDays: 14,
      reputationScore: 1.8,
      swipesCount: 140,
      reportsCount: 8,
      resolvedCount: 6,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-08-18T06:00:00Z',
    };
    this.users.set(user2.id, user2);

    // Seed realistic problem reports across all 5 districts in Shymkent
    const initialProblemsList: ProblemReport[] = [
      {
        id: 'rep-001',
        title: 'Глубокая яма на перекрестке пр. Тауке Хана и ул. Байтурсынова',
        description: 'Асфальт провалился возле пешеходного перехода. В вечернее время машины бьют подвеску, создается аварийная ситуация у ТРЦ Shymkent Plaza.',
        category: ProblemCategory.ROADS,
        district: District.AL_FARABI,
        latitude: 42.3195,
        longitude: 69.5932,
        address: 'г. Шымкент, Аль-Фарабийский р-н, пр. Тәуке хан / ул. Байтұрсынов',
        osmPlaceId: '298174129',
        photoUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.SENT_TO_109,
        criticalityIndex: 8.75,
        swipeRightCount: 142,
        swipeLeftCount: 12,
        swipeUpCount: 18,
        totalViews: 410,
        ekc109TicketId: 'EKC-109-2026-0814-491',
        ekc109Status: EKCStatus.IN_WORK_109,
        ekc109SyncedAt: '2026-08-17T14:20:00Z',
        ekc109ResponseText: 'Заявка принята в работу районным отделом пассажирского транспорта и автодорог.',
        authorId: 'usr-shym-002',
        authorName: 'Айгерим Омарова',
        createdAt: '2026-08-16T08:30:00Z',
        updatedAt: '2026-08-18T05:10:00Z',
      },
      {
        id: 'rep-002',
        title: 'Стихийный сброс строительного мусора возле парка «Жайлаукөл»',
        description: 'Грузовики выгрузили строительные блоки и сухие ветки в водоохранной зоне озера Тулпар / Жайлаукөл. Необходима эко-очистка.',
        category: ProblemCategory.ECOLOGY,
        district: District.ABAY,
        latitude: 42.3045,
        longitude: 69.5741,
        address: 'г. Шымкент, Абайский р-н, ул. Казиева, прибрежная зона озера Тұлпар',
        photoUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 7.20,
        swipeRightCount: 89,
        swipeLeftCount: 14,
        swipeUpCount: 34,
        totalViews: 280,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-003',
        authorName: 'Ерлан Касымов',
        createdAt: '2026-08-17T11:15:00Z',
        updatedAt: '2026-08-18T04:20:00Z',
      },
      {
        id: 'rep-003',
        title: 'Открытый канализационный люк возле школы №65 в мкр. Нурсат',
        description: 'Чугунная крышка люка отсутствует, колодец прикрыт только ветками. Рядом ходят школьники. Высокий риск травматизма!',
        category: ProblemCategory.SAFETY,
        district: District.KARATAU,
        latitude: 42.3688,
        longitude: 69.6284,
        address: 'г. Шымкент, Каратауский р-н, мкр. Нұрсат, проспект Астана 44',
        photoUrls: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.SENT_TO_109,
        criticalityIndex: 9.60,
        swipeRightCount: 310,
        swipeLeftCount: 3,
        swipeUpCount: 8,
        totalViews: 680,
        ekc109TicketId: 'EKC-109-2026-0818-012',
        ekc109Status: EKCStatus.IN_WORK_109,
        ekc109SyncedAt: '2026-08-18T02:00:00Z',
        ekc109ResponseText: 'Срочный вызов передан аварийной бригаде ГКП «Су ресурстары-Маркетинг».',
        authorId: 'usr-shym-004',
        authorName: 'Динара Муканова',
        createdAt: '2026-08-18T01:30:00Z',
        updatedAt: '2026-08-18T06:00:00Z',
      },
      {
        id: 'rep-004',
        title: 'Порыв водопровода и затопление тротуара по ул. Капал Батыра',
        description: 'Холодная вода хлещет из-под земли уже вторые сутки, размывает фундамент остановки и блокирует проход пешеходов к промзоне.',
        category: ProblemCategory.ZHKH,
        district: District.ENBEKSHI,
        latitude: 42.2891,
        longitude: 69.6455,
        address: 'г. Шымкент, Енбекшинский р-н, ул. Қапал батыр, 88',
        photoUrls: ['https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 8.85,
        swipeRightCount: 94,
        swipeLeftCount: 6,
        swipeUpCount: 5,
        totalViews: 210,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-005',
        authorName: 'Мурат Бекенов',
        createdAt: '2026-08-18T04:10:00Z',
        updatedAt: '2026-08-18T05:00:00Z',
      },
      {
        id: 'rep-005',
        title: 'Не работает уличное освещение вдоль нового бульвара в Шымкент-Сити',
        description: 'На отрезке 800 метров не горят фонари. Вечером темно, мамы с колясками и подростки опасаются переходить неосвещенную проезжую часть.',
        category: ProblemCategory.SAFETY,
        district: District.TURAN,
        latitude: 42.3512,
        longitude: 69.5388,
        address: 'г. Шымкент, Туранский р-н, мкр. Шымкент-Сити, бульвар Независимости',
        photoUrls: ['https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 6.40,
        swipeRightCount: 52,
        swipeLeftCount: 14,
        swipeUpCount: 7,
        totalViews: 160,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-006',
        authorName: 'Жасулан Темир',
        createdAt: '2026-08-18T03:45:00Z',
        updatedAt: '2026-08-18T05:30:00Z',
      },
      {
        id: 'rep-006',
        title: 'Сломанные качели и торчащие гвозди на детской площадке по ул. Рыскулова',
        description: 'Деревянный настил прогнил, металлическая цепь оборвалась. Дети могут получить травму.',
        category: ProblemCategory.LANDSCAPING,
        district: District.ABAY,
        latitude: 42.3321,
        longitude: 69.5694,
        address: 'г. Шымкент, Абайский р-н, ул. Рысқұлов, двор домов 14-16',
        photoUrls: ['https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.IN_PROGRESS,
        criticalityIndex: 7.90,
        swipeRightCount: 114,
        swipeLeftCount: 9,
        swipeUpCount: 21,
        totalViews: 320,
        ekc109TicketId: 'EKC-109-2026-0815-201',
        ekc109Status: EKCStatus.CONTRACTOR_ASSIGN,
        ekc109SyncedAt: '2026-08-16T10:00:00Z',
        ekc109ResponseText: 'Объект передан в управление комфортной городской среды.',
        authorId: 'usr-shym-001',
        authorName: 'Батырхан Сейдалиев',
        createdAt: '2026-08-15T09:00:00Z',
        updatedAt: '2026-08-17T16:00:00Z',
      },
      {
        id: 'rep-007',
        title: 'Аварийное обрушение тротуарной плитки возле стадиона им. Кажымукана',
        description: 'После ливня просел грунт под тротуаром, образовался провал глубиной 40 см прямо на пути к спортивному комплексу.',
        category: ProblemCategory.ROADS,
        district: District.AL_FARABI,
        latitude: 42.3242,
        longitude: 69.5878,
        address: 'г. Шымкент, Аль-Фарабийский р-н, ул. Мадели кожа 1',
        photoUrls: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 8.10,
        swipeRightCount: 78,
        swipeLeftCount: 5,
        swipeUpCount: 12,
        totalViews: 230,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-002',
        authorName: 'Айгерим Омарова',
        createdAt: '2026-08-18T05:20:00Z',
        updatedAt: '2026-08-18T06:10:00Z',
      },
      {
        id: 'rep-008',
        title: 'Утечка газа и запах возле распределительного узла по ул. Желтоксан',
        description: 'Жители сообщают о характерном запахе одоранта возле ГРП №12. Требуется срочный выезд аварийной газовой службы!',
        category: ProblemCategory.ZHKH,
        district: District.AL_FARABI,
        latitude: 42.3275,
        longitude: 69.6012,
        address: 'г. Шымкент, Аль-Фарабийский р-н, ул. Желтоқсан 38',
        photoUrls: ['https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.SENT_TO_109,
        criticalityIndex: 9.90,
        swipeRightCount: 420,
        swipeLeftCount: 1,
        swipeUpCount: 4,
        totalViews: 920,
        ekc109TicketId: 'EKC-109-2026-0818-099',
        ekc109Status: EKCStatus.IN_WORK_109,
        ekc109SyncedAt: '2026-08-18T06:05:00Z',
        ekc109ResponseText: 'Аварийная служба АО «КазТрансГаз Аймак» направлена на место для локализации утечки.',
        authorId: 'usr-shym-001',
        authorName: 'Батырхан Сейдалиев',
        createdAt: '2026-08-18T05:55:00Z',
        updatedAt: '2026-08-18T06:15:00Z',
      },
      {
        id: 'rep-009',
        title: 'Отсутствие пандуса и высокие бордюры у поликлиники №3 в мкр. Восток',
        description: 'Инвалиды-колясочники и пожилые граждане не могут самостоятельно подняться к входу в филиал поликлиники.',
        category: ProblemCategory.ACCESSIBILITY,
        district: District.ENBEKSHI,
        latitude: 42.3082,
        longitude: 69.6580,
        address: 'г. Шымкент, Енбекшинский р-н, мкр. Восток, ул. Сайрамская 112',
        photoUrls: ['https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 6.90,
        swipeRightCount: 65,
        swipeLeftCount: 8,
        swipeUpCount: 19,
        totalViews: 195,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-003',
        authorName: 'Ерлан Касымов',
        createdAt: '2026-08-17T15:00:00Z',
        updatedAt: '2026-08-18T02:00:00Z',
      },
      {
        id: 'rep-010',
        title: 'Повреждение электронного табло и навеса на остановке «ЦУМ»',
        description: 'Разбито стекло навеса, электронное табло расписания автобусов обесточено после ДТП.',
        category: ProblemCategory.TRANSPORT,
        district: District.AL_FARABI,
        latitude: 42.3168,
        longitude: 69.5955,
        address: 'г. Шымкент, Аль-Фарабийский р-н, пр. Тәуке хан 15',
        photoUrls: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'],
        status: ReportStatus.NEW,
        criticalityIndex: 6.30,
        swipeRightCount: 48,
        swipeLeftCount: 15,
        swipeUpCount: 3,
        totalViews: 170,
        ekc109TicketId: null,
        ekc109Status: EKCStatus.PENDING_SYNC,
        authorId: 'usr-shym-004',
        authorName: 'Динара Муканова',
        createdAt: '2026-08-18T04:50:00Z',
        updatedAt: '2026-08-18T05:40:00Z',
      }
    ];

    initialProblemsList.forEach(prob => {
      this.problems.set(prob.id, prob);
    });

    // Seed 1 initial swipe for usr-shym-001 on rep-006 so we can test the exclusion logic
    this.swipes.push({
      id: 'swp-init-01',
      userId: 'usr-shym-001',
      problemId: 'rep-006',
      swipeType: SwipeType.RIGHT_IMPORTANT,
      weight: 1.5,
      isLocalUser: true,
      createdAt: '2026-08-16T12:00:00Z',
    });
  }

  public getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getAllProblems(): ProblemReport[] {
    return Array.from(this.problems.values());
  }

  public addOrUpdateProblem(prob: ProblemReport): void {
    this.problems.set(prob.id, prob);
  }

  public updateProblemStatus(
    id: string,
    status: ReportStatus,
    resolutionPhotoUrls?: string[],
    inspectorNotes?: string
  ): ProblemReport | null {
    const prob = this.problems.get(id);
    if (!prob) return null;

    prob.status = status;
    if (resolutionPhotoUrls && resolutionPhotoUrls.length > 0) {
      prob.resolutionPhotoUrls = resolutionPhotoUrls;
    }
    if (status === ReportStatus.RESOLVED) {
      prob.resolvedAt = new Date().toISOString();
      if (!prob.resolutionPhotoUrls || prob.resolutionPhotoUrls.length === 0) {
        prob.resolutionPhotoUrls = ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'];
      }
    }
    prob.updatedAt = new Date().toISOString();
    return prob;
  }

  public recalculateDistrictAnalytics(): void {
    // Analytics recalculation hook
  }

  public getAllActiveProblems(): ProblemReport[] {
    // Only return problems that are not yet marked as resolved or rejected
    return Array.from(this.problems.values()).filter(
      p => p.status !== ReportStatus.RESOLVED && p.status !== ReportStatus.REJECTED
    );
  }

  public getProblemById(id: string): ProblemReport | undefined {
    return this.problems.get(id);
  }

  public getSwipedProblemIdsByUser(userId: string): Set<string> {
    const swipedIds = new Set<string>();
    for (const swipe of this.swipes) {
      if (swipe.userId === userId) {
        swipedIds.add(swipe.problemId);
      }
    }
    return swipedIds;
  }

  public recordSwipe(action: Omit<SwipeAction, 'id' | 'createdAt'>): SwipeAction {
    const newSwipe: SwipeAction = {
      ...action,
      id: `swp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.swipes.push(newSwipe);

    // Update the problem counter
    const problem = this.problems.get(action.problemId);
    if (problem) {
      if (action.swipeType === SwipeType.RIGHT_IMPORTANT) {
        problem.swipeRightCount += 1;
      } else if (action.swipeType === SwipeType.LEFT_IRRELEVANT) {
        problem.swipeLeftCount += 1;
      } else if (action.swipeType === SwipeType.UP_VOLUNTEER) {
        problem.swipeUpCount += 1;
        problem.swipeRightCount += 1;
      }
      problem.totalViews += 1;
      // Recalculate criticality
      const total = problem.swipeRightCount + problem.swipeLeftCount;
      const ratio = total > 0 ? (problem.swipeRightCount / total) * 10 : 5.0;
      problem.criticalityIndex = Number(Math.min(10.0, Math.max(1.0, ratio)).toFixed(2));
      problem.updatedAt = new Date().toISOString();
    }

    // Update user stats
    const user = this.users.get(action.userId);
    if (user) {
      user.swipesCount += 1;
      user.xp += action.swipeType === SwipeType.UP_VOLUNTEER ? 25 : 10;
      user.level = Math.floor(user.xp / 100) + 1;
      user.updatedAt = new Date().toISOString();
    }

    return newSwipe;
  }

  public createProblem(data: {
    title: string;
    description: string;
    category: ProblemCategory;
    district: District;
    latitude: number;
    longitude: number;
    address: string;
    osmPlaceId?: string | null;
    photoUrls: string[];
    authorId: string;
    authorName?: string;
  }): { problem: ProblemReport; user?: User } {
    const id = `rep-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newProblem: ProblemReport = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      district: data.district,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      address: data.address.trim(),
      osmPlaceId: data.osmPlaceId || null,
      photoUrls: data.photoUrls.length > 0 ? data.photoUrls : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'],
      status: ReportStatus.NEW,
      criticalityIndex: 5.0,
      swipeRightCount: 0,
      swipeLeftCount: 0,
      swipeUpCount: 0,
      totalViews: 1,
      ekc109TicketId: null,
      ekc109Status: EKCStatus.PENDING_SYNC,
      authorId: data.authorId,
      authorName: data.authorName || 'Горожанин Шымкента',
      createdAt: now,
      updatedAt: now,
    };

    this.problems.set(newProblem.id, newProblem);

    // Award +50 XP for reporting a new problem
    const user = this.users.get(data.authorId);
    if (user) {
      user.xp += 50;
      user.reportsCount += 1;
      user.updatedAt = now;
    }

    return { problem: newProblem, user };
  }

  public resetUserSwipes(userId: string) {
    this.swipes = this.swipes.filter(s => s.userId !== userId);
  }
}

export const dbRepository = new ShymkentDataRepository();
