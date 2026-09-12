-- =============================================================================
-- 🏛️ SMART CITY ШЫМКЕНТ — PostgreSQL DDL & Spatial Optimization Script
-- Проект: «Шымкент Свайп» (Shymkent Swipe)
-- Сгенерировано для PostgreSQL 15+ / 16+ с расширениями PostGIS & B-Tree GiST
-- =============================================================================

-- 1. Активация необходимых расширений (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Создание перечислений (ENUMs)
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'VOLUNTEER', 'INSPECTOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "District" AS ENUM ('ABAY', 'AL_FARABI', 'ENBEKSHI', 'KARATAU', 'TURAN');
CREATE TYPE "ProblemCategory" AS ENUM ('ZHKH', 'ROADS', 'ECOLOGY', 'SAFETY', 'TRANSPORT', 'LANDSCAPING', 'ACCESSIBILITY');
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'VERIFIED', 'SENT_TO_109', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE');
CREATE TYPE "SwipeType" AS ENUM ('RIGHT_IMPORTANT', 'LEFT_IRRELEVANT', 'UP_VOLUNTEER');
CREATE TYPE "EKCStatus" AS ENUM ('PENDING_SYNC', 'SYNCED', 'IN_WORK_109', 'CONTRACTOR_ASSIGN', 'CLOSED_109', 'SYNC_FAILED');

-- 3. Таблица пользователей (users)
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "telegramId" BIGINT UNIQUE,
    "telegramUsername" VARCHAR(100),
    "phone" VARCHAR(20) UNIQUE,
    "fullName" VARCHAR(150),
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "district" "District" NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streakDays" INTEGER NOT NULL DEFAULT 1,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "swipesCount" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "resolvedCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Таблица заявок о проблемах (problem_reports)
CREATE TABLE "problem_reports" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProblemCategory" NOT NULL,
    "district" "District" NOT NULL,
    "latitude" NUMERIC(10, 7) NOT NULL,
    "longitude" NUMERIC(10, 7) NOT NULL,
    "address" VARCHAR(350) NOT NULL,
    "osmPlaceId" BIGINT,
    "photoUrls" TEXT[] NOT NULL DEFAULT '{}',
    "resolutionPhotoUrls" TEXT[] NOT NULL DEFAULT '{}',
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "criticalityIndex" NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    "swipe_right_count" INTEGER NOT NULL DEFAULT 0,
    "swipe_left_count" INTEGER NOT NULL DEFAULT 0,
    "swipe_up_count" INTEGER NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "ekc_109_ticket_id" VARCHAR(64) UNIQUE,
    "ekc_109_status" "EKCStatus" NOT NULL DEFAULT 'PENDING_SYNC',
    "ekc_109_synced_at" TIMESTAMPTZ,
    "ekc_109_response_text" TEXT,
    "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "inspector_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Виртуальная PostGIS геометрия для пространственных запросов ST_DWithin / ST_DistanceSphere
ALTER TABLE "problem_reports" 
ADD COLUMN IF NOT EXISTS "geom" geometry(Point, 4326) 
GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED;

-- 5. Таблица свайпов (swipe_actions)
CREATE TABLE "swipe_actions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "problem_id" UUID NOT NULL REFERENCES "problem_reports"("id") ON DELETE CASCADE,
    "swipe_type" "SwipeType" NOT NULL,
    "weight" NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    "is_local_user" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_user_problem_swipe" UNIQUE ("user_id", "problem_id")
);

-- 6. Таблица районной аналитики для Акимата (district_analytics)
CREATE TABLE "district_analytics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "district" "District" NOT NULL,
    "date" DATE NOT NULL,
    "total_reports" INTEGER NOT NULL DEFAULT 0,
    "new_reports" INTEGER NOT NULL DEFAULT 0,
    "in_progress_reports" INTEGER NOT NULL DEFAULT 0,
    "resolved_reports" INTEGER NOT NULL DEFAULT 0,
    "rejected_reports" INTEGER NOT NULL DEFAULT 0,
    "avg_resolution_time_hours" NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    "avg_criticality_index" NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    "total_swipes_count" INTEGER NOT NULL DEFAULT 0,
    "top_category" "ProblemCategory",
    "volunteer_actions_count" INTEGER NOT NULL DEFAULT 0,
    "active_citizens_count" INTEGER NOT NULL DEFAULT 0,
    "ekc_109_sync_rate" NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    "ekc_109_resolved_rate" NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_district_date_analytics" UNIQUE ("district", "date")
);

-- 7. Дополнительные таблицы (Волонтеры, Комментарии, Бейджи, Логи ЕКЦ 109)
CREATE TABLE "volunteer_tasks" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "problem_id" UUID NOT NULL REFERENCES "problem_reports"("id") ON DELETE CASCADE,
    "volunteer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'JOINED',
    "notes" TEXT,
    "xp_reward" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "completed_at" TIMESTAMPTZ
);

CREATE TABLE "report_comments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "problem_id" UUID NOT NULL REFERENCES "problem_reports"("id") ON DELETE CASCADE,
    "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "is_official" BOOLEAN NOT NULL DEFAULT FALSE,
    "photoUrls" TEXT[] NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ekc_109_sync_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "problem_id" UUID NOT NULL REFERENCES "problem_reports"("id") ON DELETE CASCADE,
    "request_body" JSONB NOT NULL,
    "response_body" JSONB,
    "http_status" INTEGER NOT NULL,
    "is_success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ИНДЕКСЫ ДЛЯ СВЕРХБЫСТРОЙ ВЫБОРКИ И ГЕОПОИСКА (SHYMKENT SPATIAL INDEXES)
-- =============================================================================

-- Пространственный GiST индекс для мгновенного гео-поиска в радиусе (PostGIS R-Tree)
CREATE INDEX idx_reports_postgis_geom ON "problem_reports" USING GIST ("geom");

-- Составной индекс B-Tree по координатам для резервных bounding-box выборок
CREATE INDEX idx_reports_geo_coords ON "problem_reports" ("latitude", "longitude");

-- Индекс для свайп-ленты (топ нерешенных проблем по критичности)
CREATE INDEX idx_reports_status_criticality ON "problem_reports" ("status", "criticalityIndex" DESC);

-- Индекс для фильтрации по району и статусу на дашборде акимата
CREATE INDEX idx_reports_district_status ON "problem_reports" ("district", "status");

-- Индекс для коммунальных служб по категории
CREATE INDEX idx_reports_category_status ON "problem_reports" ("category", "status");

-- Быстрый поиск по номеру тикета ЕКЦ 109
CREATE INDEX idx_reports_ekc109_ticket ON "problem_reports" ("ekc_109_ticket_id");

-- Индекс истории свайпов и агрегации
CREATE INDEX idx_swipes_problem_type ON "swipe_actions" ("problem_id", "swipe_type");
CREATE INDEX idx_swipes_user_history ON "swipe_actions" ("user_id", "created_at" DESC);

-- Индекс по лидерборду пользователей
CREATE INDEX idx_users_xp_desc ON "users" ("xp" DESC);
