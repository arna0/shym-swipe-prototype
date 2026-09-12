export const PRISMA_SCHEMA_CODE = `// ==============================================================================
// 🏛️ ШЫМКЕНТ СВАЙП (SHYMKENT SWIPE) — SMART CITY HACKATHON
// Relational Database Architecture & Prisma Schema (PostgreSQL + PostGIS/Geo-indexes)
// ==============================================================================

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres", "postgresqlExtensions"]
}

// ------------------------------------------------------------------------------
// ENUMS (Перечисления)
// ------------------------------------------------------------------------------

/// Роли пользователей в системе городского мониторинга
enum Role {
  CITIZEN      // Обычный горожанин (создает заявки, свайпает, получает XP)
  VOLUNTEER    // Активный волонтер (берет задачи по UP_VOLUNTEER)
  INSPECTOR    // Инспектор районного акимата / коммунальной службы
  ADMIN        // Администратор системы / Оператор ЕКЦ 109
  SUPER_ADMIN  // Руководство акимата г. Шымкент
}

/// Районы города Шымкент
enum District {
  ABAY         // Абайский район (Абай ауданы)
  AL_FARABI    // Аль-Фарабийский район (Әл-Фараби ауданы)
  ENBEKSHI     // Енбекшинский район (Еңбекші ауданы)
  KARATAU      // Каратауский район (Қаратау ауданы)
  TURAN        // Туранский район (Тұран ауданы — новый 5-й район)
}

/// Категории городских проблем
enum ProblemCategory {
  ZHKH          // ЖКХ (Водоснабжение, отопление, канализация, электроэнергия)
  ROADS         // Дорожная инфраструктура (ямы, светофоры, разметка, люки)
  ECOLOGY       // Экология и благоустройство (стихийные свалки, спил деревьев, смог)
  SAFETY        // Общественная безопасность (освещение, бродячие собаки, открытые колодцы)
  TRANSPORT     // Общественный транспорт (остановки, автобусные маршруты)
  LANDSCAPING   // Озеленение и детские площадки
  ACCESSIBILITY // Безбарьерная среда (пандусы, доступность для маломобильных)
}

/// Статусы жизненного цикла заявки
enum ReportStatus {
  NEW          // Новая (в процессе народного голосования свайпами)
  VERIFIED     // Подтверждена гражданами (высокий критический индекс)
  SENT_TO_109  // Автоматически передана в ЕКЦ 109
  IN_PROGRESS  // В работе у подрядчика / районного акимата
  RESOLVED     // Решена (подтверждено фотоотчетом инспектора)
  REJECTED     // Отклонена (спам, дубликат, не относится к компетенции)
  DUPLICATE    // Привязана как дубликат к существующей заявке
}

/// Типы пользовательских свайпов
enum SwipeType {
  RIGHT_IMPORTANT   // Свайп ВПРАВО: «Это важно / Критично для города» (+1 голос за приоритет)
  LEFT_IRRELEVANT   // Свайп ВЛЕВО: «Неактуально / Не критично» (-0.5 к приоритету)
  UP_VOLUNTEER      // Свайп ВВЕРХ: «Готов помочь / Стану волонтером» (заявка в эко-патруль)
}

/// Статусы интеграции с Единым координационным центром (ЕКЦ 109)
enum EKCStatus {
  PENDING_SYNC      // Ожидает порога критичности для отправки
  SYNCED            // Успешно экспортирована в базу ЕКЦ 109
  IN_WORK_109       // Принята диспетчером 109 в работу
  CONTRACTOR_ASSIGN // Назначен подрядчик
  CLOSED_109        // Закрыта службой 109
  SYNC_FAILED       // Ошибка соединения / валидации
}

// ------------------------------------------------------------------------------
// MODELS (Модели данных)
// ------------------------------------------------------------------------------

/// 1. Пользователь платформы (User)
/// Включает Telegram ID / Auth Token, геймификацию (XP, уровни) и район проживания
model User {
  id               String              @id @default(uuid()) @db.Uuid
  telegramId       BigInt?             @unique /// Telegram ID для мгновенной авторизации через бота/Mini App
  telegramUsername String?             /// Юзернейм в Telegram (@username)
  phone            String?             @unique /// Номер телефона (+77...)
  fullName         String?             /// Имя и фамилия гражданина
  avatarUrl        String?             /// URL аватарки
  
  role             Role                @default(CITIZEN)
  district         District            /// Район проживания в Шымкенте (дает +50% вес свайпа в своем районе)
  
  // Геймификация
  xp               Int                 @default(0) /// Очки опыта (XP) за свайпы и репорты
  level            Int                 @default(1) /// Уровень геймификации (1 = Бастаушы, 5 = Қала сақшысы)
  streakDays       Int                 @default(1) /// Серия дней непрерывной активности
  reputationScore  Float               @default(1.0) /// Множитель доверия к голосу пользователя (0.5 - 3.0)
  
  // Статистика
  swipesCount      Int                 @default(0)
  reportsCount     Int                 @default(0)
  resolvedCount    Int                 @default(0) /// Количество решенных проблем, в которых участвовал

  createdAt        DateTime            @default(now()) @map("created_at")
  updatedAt        DateTime            @updatedAt @map("updated_at")

  // Связи (Relations)
  reportsCreated   ProblemReport[]     @relation("AuthorReports")
  reportsInspected ProblemReport[]     @relation("InspectorReports")
  swipeActions     SwipeAction[]
  comments         ReportComment[]
  volunteerTasks   VolunteerTask[]     @relation("UserVolunteerTasks")
  userBadges       UserBadge[]
  auditLogs        AuditLog[]

  @@index([district])
  @@index([role])
  @@index([xp(sort: Desc)])
  @@map("users")
}

/// 2. Заявка о городской проблеме (ProblemReport)
/// Геолокация OpenStreetMap, фото, статус, расчетный индекс критичности и связь с ЕКЦ 109
model ProblemReport {
  id                  String           @id @default(uuid()) @db.Uuid
  title               String           @db.VarChar(200) /// Краткий заголовок проблемы
  description         String           @db.Text /// Детальное описание ситуации
  category            ProblemCategory  /// Категория (ЖКХ, Дороги, Экология...)
  district            District         /// Район города Шымкент
  
  // Геолокация (OpenStreetMap)
  latitude            Decimal          @db.Decimal(10, 7) /// Широта (Шымкент: ~42.315)
  longitude           Decimal          @db.Decimal(10, 7) /// Долгота (Шымкент: ~69.587)
  address             String           @db.VarChar(350) /// Адрес из OpenStreetMap / обратное геокодирование
  osmPlaceId          BigInt?          /// Идентификатор точки в OpenStreetMap
  
  // Медиа
  photoUrls           String[]         /// Массив ссылок на фотографии дефекта
  resolutionPhotoUrls String[]         @default([]) /// Фото после устранения проблемы
  
  // Статусы и приоритет
  status              ReportStatus     @default(NEW)
  criticalityIndex    Decimal          @default(0.00) @db.Decimal(6, 2) /// Рассчитывается динамически алгоритмом свайпов
  
  // Счетчики свайпов для быстрого O(1) чтения
  swipeRightCount     Int              @default(0) @map("swipe_right_count") /// «Важно»
  swipeLeftCount      Int              @default(0) @map("swipe_left_count")  /// «Не важно»
  swipeUpCount        Int              @default(0) @map("swipe_up_count")    /// «Волонтер»
  totalViews          Int              @default(0) @map("total_views")
  
  // Интеграция с Единым координационным центром 109 (Smart Shymkent 109)
  ekc109TicketId      String?          @unique @map("ekc_109_ticket_id") @db.VarChar(64) /// Номер тикета в системе 109
  ekc109Status        EKCStatus        @default(PENDING_SYNC) @map("ekc_109_status")
  ekc109SyncedAt      DateTime?        @map("ekc_109_synced_at")
  ekc109ResponseText  String?          @map("ekc_109_response_text") @db.Text /// Официальный ответ диспетчера 109
  
  // Связи с авторами и исполнителями
  authorId            String           @map("author_id") @db.Uuid
  author              User             @relation("AuthorReports", fields: [authorId], references: [id], onDelete: Cascade)
  
  inspectorId         String?          @map("inspector_id") @db.Uuid
  inspector           User?            @relation("InspectorReports", fields: [inspectorId], references: [id], onDelete: SetNull)
  
  resolvedAt          DateTime?        @map("resolved_at")
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  // Связи
  swipes              SwipeAction[]
  comments            ReportComment[]
  volunteerTasks      VolunteerTask[]
  ekcSyncLogs         EKC109SyncLog[]

  // Индексы для сверхбыстрого геопоиска, фильтрации акимата и свайп-ленты
  @@index([latitude, longitude], name: "idx_reports_geo_coords") /// Быстрый B-Tree поиск по координатам
  @@index([district, status], name: "idx_reports_district_status") /// Дашборд районного акимата
  @@index([status, criticalityIndex(sort: Desc)], name: "idx_reports_status_criticality") /// Лента свайпов (топ критичных)
  @@index([category, status], name: "idx_reports_category_status") /// Фильтр коммунальных служб
  @@index([ekc109TicketId], name: "idx_reports_ekc109_ticket") /// Поиск по номеру ЕКЦ 109
  @@index([createdAt(sort: Desc)], name: "idx_reports_created_at")
  @@map("problem_reports")
}

/// 3. Действие свайпа (SwipeAction)
/// Фиксирует решение пользователя, вес его голоса и таймстамп
model SwipeAction {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  problemId   String        @map("problem_id") @db.Uuid
  swipeType   SwipeType     @map("swipe_type")
  
  weight      Decimal       @default(1.00) @db.Decimal(4, 2) /// Вес свайпа (повышается при совпадении района)
  isLocalUser Boolean       @default(false) @map("is_local_user") /// Свайпнул ли житель того же района
  
  createdAt   DateTime      @default(now()) @map("created_at")

  // Связи
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem     ProblemReport @relation(fields: [problemId], references: [id], onDelete: Cascade)

  // Уникальность: один пользователь свайпает конкретную проблему только один раз
  @@unique([userId, problemId], name: "unique_user_problem_swipe")
  @@index([problemId, swipeType], name: "idx_swipes_problem_type")
  @@index([userId, createdAt(sort: Desc)], name: "idx_swipes_user_history")
  @@map("swipe_actions")
}

/// 4. Районная аналитика (DistrictAnalytics)
/// Агрегированные метрики для руководства и дашборда акимата г. Шымкент
model DistrictAnalytics {
  id                     String           @id @default(uuid()) @db.Uuid
  district               District
  date                   DateTime         @db.Date /// Дата среза аналитики (ежедневно)
  
  // Метрики проблем
  totalReports           Int              @default(0) @map("total_reports")
  newReports             Int              @default(0) @map("new_reports")
  inProgressReports      Int              @default(0) @map("in_progress_reports")
  resolvedReports        Int              @default(0) @map("resolved_reports")
  rejectedReports        Int              @default(0) @map("rejected_reports")
  
  // Качественные показатели
  avgResolutionTimeHours Decimal          @default(0.00) @map("avg_resolution_time_hours") @db.Decimal(8, 2)
  avgCriticalityIndex    Decimal          @default(0.00) @map("avg_criticality_index") @db.Decimal(5, 2)
  totalSwipesCount       Int              @default(0) @map("total_swipes_count")
  
  // Доминирующая проблема района
  topCategory            ProblemCategory? @map("top_category")
  
  // Вовлеченность и ЕКЦ 109
  volunteerActionsCount  Int              @default(0) @map("volunteer_actions_count")
  activeCitizensCount    Int              @default(0) @map("active_citizens_count")
  ekc109SyncRate         Decimal          @default(0.00) @map("ekc_109_sync_rate") @db.Decimal(5, 2) /// % переданных в 109
  ekc109ResolvedRate     Decimal          @default(0.00) @map("ekc_109_resolved_rate") @db.Decimal(5, 2) /// % решенных через 109

  createdAt              DateTime         @default(now()) @map("created_at")
  updatedAt              DateTime         @updatedAt @map("updated_at")

  @@unique([district, date], name: "unique_district_date_analytics")
  @@index([district])
  @@index([date(sort: Desc)])
  @@map("district_analytics")
}

// ------------------------------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ МОДЕЛИ
// ------------------------------------------------------------------------------

model VolunteerTask {
  id          String        @id @default(uuid()) @db.Uuid
  problemId   String        @map("problem_id") @db.Uuid
  volunteerId String        @map("volunteer_id") @db.Uuid
  status      String        @default("JOINED")
  notes       String?       @db.Text
  xpReward    Int           @default(50) @map("xp_reward")
  createdAt   DateTime      @default(now()) @map("created_at")
  completedAt DateTime?     @map("completed_at")

  problem     ProblemReport @relation(fields: [problemId], references: [id], onDelete: Cascade)
  volunteer   User          @relation("UserVolunteerTasks", fields: [volunteerId], references: [id], onDelete: Cascade)

  @@index([problemId])
  @@index([volunteerId])
  @@map("volunteer_tasks")
}

model ReportComment {
  id          String        @id @default(uuid()) @db.Uuid
  problemId   String        @map("problem_id") @db.Uuid
  authorId    String        @map("author_id") @db.Uuid
  content     String        @db.Text
  isOfficial  Boolean       @default(false) @map("is_official")
  photoUrls   String[]      @default([])
  createdAt   DateTime      @default(now()) @map("created_at")

  problem     ProblemReport @relation(fields: [problemId], references: [id], onDelete: Cascade)
  author      User          @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([problemId, createdAt])
  @@map("report_comments")
}

model EKC109SyncLog {
  id           String        @id @default(uuid()) @db.Uuid
  problemId    String        @map("problem_id") @db.Uuid
  requestBody  Json          @map("request_body")
  responseBody Json?         @map("response_body")
  httpStatus   Int           @map("http_status")
  isSuccess    Boolean       @map("is_success")
  errorMessage String?       @map("error_message") @db.Text
  createdAt    DateTime      @default(now()) @map("created_at")

  problem      ProblemReport @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@index([problemId])
  @@index([createdAt(sort: Desc)])
  @@map("ekc_109_sync_logs")
}

model UserBadge {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  badgeCode String   @map("badge_code")
  title     String
  iconName  String   @map("icon_name")
  awardedAt DateTime @default(now()) @map("awarded_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeCode])
  @@map("user_badges")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String
  details   Json
  createdAt DateTime @default(now()) @map("created_at")

  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}`;

export const PRISMA_QUERY_SNIPPETS = {
  swipeTransaction: `// 1. Атомарная обработка свайпа с пересчетом критичности и начислением XP
import { PrismaClient, SwipeType, ReportStatus, EKCStatus } from '@prisma/client';
const prisma = new PrismaClient();

export async function processSwipeAction({
  userId,
  problemId,
  swipeType,
}: {
  userId: string;
  problemId: string;
  swipeType: SwipeType;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Получаем пользователя и проблему для расчета веса
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const problem = await tx.problemReport.findUniqueOrThrow({ where: { id: problemId } });

    // Проверяем, совпадает ли район (жители района получают +50% к весу голоса)
    const isLocal = user.district === problem.district;
    const voteWeight = (isLocal ? 1.5 : 1.0) * user.reputationScore;

    // 2. Создаем запись свайпа (защищено @@unique([userId, problemId]))
    const swipe = await tx.swipeAction.create({
      data: {
        userId,
        problemId,
        swipeType,
        weight: voteWeight,
        isLocalUser: isLocal,
      },
    });

    // 3. Обновляем счетчики свайпов в репорте
    const rightInc = swipeType === SwipeType.RIGHT_IMPORTANT ? 1 : 0;
    const leftInc = swipeType === SwipeType.LEFT_IRRELEVANT ? 1 : 0;
    const upInc = swipeType === SwipeType.UP_VOLUNTEER ? 1 : 0;

    const updatedRight = problem.swipeRightCount + rightInc;
    const updatedLeft = problem.swipeLeftCount + leftInc;
    const updatedUp = problem.swipeUpCount + upInc;
    const totalSwipes = updatedRight + updatedLeft + updatedUp;

    // 4. Формула автоматического индекса критичности (0.0 - 10.0)
    // Category Multiplier: SAFETY (1.4), ZHKH (1.2), ROADS (1.1), ECOLOGY (1.0)
    const categoryWeights: Record<string, number> = {
      SAFETY: 1.4,
      ZHKH: 1.2,
      ROADS: 1.1,
      ECOLOGY: 1.0,
      TRANSPORT: 1.0,
      LANDSCAPING: 0.9,
      ACCESSIBILITY: 1.1,
    };
    const catMultiplier = categoryWeights[problem.category] || 1.0;
    const approvalRatio = totalSwipes > 0 ? (updatedRight * 1.0 + updatedUp * 1.2) / totalSwipes : 0;
    const volumeBonus = Math.min(Math.log10(totalSwipes + 1) * 2.5, 3.5);
    const newCriticality = Math.min(10.0, +(approvalRatio * 6.5 * catMultiplier + volumeBonus).toFixed(2));

    // Авто-эскалация в ЕКЦ 109 при преодолении порога критичности >= 7.5
    let newStatus = problem.status;
    let ekcStatus = problem.ekc109Status;
    if (newCriticality >= 7.5 && problem.status === ReportStatus.NEW) {
      newStatus = ReportStatus.SENT_TO_109;
      ekcStatus = EKCStatus.PENDING_SYNC;
    }

    const updatedReport = await tx.problemReport.update({
      where: { id: problemId },
      data: {
        swipeRightCount: { increment: rightInc },
        swipeLeftCount: { increment: leftInc },
        swipeUpCount: { increment: upInc },
        totalViews: { increment: 1 },
        criticalityIndex: newCriticality,
        status: newStatus,
        ekc109Status: ekcStatus,
      },
    });

    // 5. Начисляем XP и уровень пользователю
    const xpGained = swipeType === SwipeType.UP_VOLUNTEER ? 50 : 10;
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;

    await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpGained },
        level: newLevel,
        swipesCount: { increment: 1 },
      },
    });

    // Если свайп UP_VOLUNTEER — создаем волонтерскую задачу
    if (swipeType === SwipeType.UP_VOLUNTEER) {
      await tx.volunteerTask.create({
        data: {
          problemId,
          volunteerId: userId,
          status: 'JOINED',
          xpReward: 50,
        },
      });
    }

    return { swipe, updatedReport, xpGained, newLevel };
  });
}`,

  spatialRadiusQuery: `// 2. Сверхбыстрый геопоиск проблем в радиусе (Haversine / PostGIS B-Tree)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function findNearbyProblems(
  lat: number,
  lon: number,
  radiusMeters: number = 2500
) {
  // Выборка через PostGIS ST_DWithin / ST_DistanceSphere
  return await prisma.$queryRaw\`
    SELECT 
      id,
      title,
      category,
      district,
      latitude,
      longitude,
      address,
      "photoUrls",
      status,
      "criticalityIndex",
      "swipe_right_count" AS "swipeRightCount",
      ST_DistanceSphere(
        ST_MakePoint(\${lon}, \${lat}),
        ST_MakePoint(longitude, latitude)
      ) AS distance_meters
    FROM problem_reports
    WHERE 
      status NOT IN ('RESOLVED', 'REJECTED')
      AND ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint(\${lon}, \${lat})::geography,
        \${radiusMeters}
      )
    ORDER BY distance_meters ASC, "criticalityIndex" DESC
    LIMIT 30;
  \`;
}`,

  akimatAggregation: `// 3. Агрегация суточной аналитики по 5 районам Шымкента для Акимата
import { PrismaClient, District, ReportStatus } from '@prisma/client';
const prisma = new PrismaClient();

export async function generateDailyDistrictAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const districts = Object.values(District);

  for (const district of districts) {
    const [total, newCount, inProg, resolved, rejected, avgCrit] = await Promise.all([
      prisma.problemReport.count({ where: { district } }),
      prisma.problemReport.count({ where: { district, status: ReportStatus.NEW } }),
      prisma.problemReport.count({ where: { district, status: ReportStatus.IN_PROGRESS } }),
      prisma.problemReport.count({ where: { district, status: ReportStatus.RESOLVED } }),
      prisma.problemReport.count({ where: { district, status: ReportStatus.REJECTED } }),
      prisma.problemReport.aggregate({
        where: { district },
        _avg: { criticalityIndex: true },
      }),
    ]);

    const swipesAgg = await prisma.swipeAction.count({
      where: { problem: { district } },
    });

    const activeUsers = await prisma.user.count({
      where: { district, swipesCount: { gt: 0 } },
    });

    await prisma.districtAnalytics.upsert({
      where: {
        unique_district_date_analytics: {
          district,
          date: today,
        },
      },
      update: {
        totalReports: total,
        newReports: newCount,
        inProgressReports: inProg,
        resolvedReports: resolved,
        rejectedReports: rejected,
        avgCriticalityIndex: avgCrit._avg.criticalityIndex || 0,
        totalSwipesCount: swipesAgg,
        activeCitizensCount: activeUsers,
        ekc109SyncRate: total > 0 ? (resolved + inProg) / total * 100 : 0,
      },
      create: {
        district,
        date: today,
        totalReports: total,
        newReports: newCount,
        inProgressReports: inProg,
        resolvedReports: resolved,
        rejectedReports: rejected,
        avgCriticalityIndex: avgCrit._avg.criticalityIndex || 0,
        totalSwipesCount: swipesAgg,
        activeCitizensCount: activeUsers,
        ekc109SyncRate: 90.0,
      },
    });
  }
}`,
};
