# 🏙️ Shymkent Swipe

**A smart-city platform where residents of Shymkent swipe through city problems to decide what gets fixed first.**

### ▶ [Live demo](https://arna0.github.io/shym-swipe-prototype/): opens in the browser, nothing to install

> On GitHub Pages there is no server, so the demo runs the same API code inside your browser (`src/demo/mockApi.ts`). Data resets when you reload the page.

Reporting a pothole or a broken streetlight usually means a phone call to the 109 hotline and no idea what happens next. Many people report the same problem, and the city can't tell what matters most. Shymkent Swipe turns this into a feed: residents report problems with a pin on the map, swipe on what others reported, and the city hall gets a ranked, de-duplicated list.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-AI%20service-009688?logo=fastapi&logoColor=white)

## Features

- 👆 **Swipe feed**: swipe right if a problem matters to you, left to skip. Votes raise a problem's priority
- 📍 **Report a problem**: pick the spot on an interactive Leaflet map and describe what's wrong
- 🤖 **AI de-duplication and urgency**: a Python microservice finds duplicate reports within **30 m over the last 48 hours** (Haversine distance), merges them into one cluster and assigns an urgency score from 1 to 10
- 🏆 **Gamification**: daily streaks and a weekly Top 10 of the most active "urbanists"
- 🏛️ **City hall (akimat) dashboard**: charts and a map of clusters, ready to hand over to the 109 service centre
- 📱 **Telegram Mini App view** so residents don't need to install anything

## Architecture

```
React + Vite (PWA, Telegram Mini App)
        │  REST
        ▼
Express server (server.ts) ── Prisma ── PostgreSQL
        │
        ▼
FastAPI AI service (src/server/ai_service) — duplicate clustering + urgency scoring
```

| API | Purpose |
|---|---|
| `GET /api/feed` | Next problems to swipe |
| `POST /api/swipe` | Record a swipe |
| `GET/POST /api/problems` | List and report problems |
| `POST /api/ai/analyze-complaint` | Cluster and score a complaint |
| `GET /api/gamification/leaderboard` | Weekly Top 10 |
| `POST /api/gamification/claim-streak` | Daily streak |
| `POST /api/demo/seed` | Fill the database with Shymkent demo data |

## Run it

```bash
npm install
cp .env.example .env.local   # set GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

AI service:

```bash
cd src/server/ai_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The database schema is in [`prisma/schema.prisma`](prisma/schema.prisma). Demo data for Shymkent can be generated with `scripts/seed_shymkent_demo_data.ts`.

## Author

Made by [Arnur](https://github.com/arna0) for the city of Shymkent.
