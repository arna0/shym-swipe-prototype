import { Router } from 'express';
import { feedController } from '../controllers/feedController';
import { swipeController } from '../controllers/swipeController';
import { problemController } from '../controllers/problemController';
import { aiController } from '../controllers/aiController';
import { gamificationController } from '../controllers/gamificationController';
import { seedController } from '../controllers/seedController';

const router = Router();

// GET /api/feed - Retrieve geo-filtered, prioritized swipe feed
router.get('/feed', (req, res) => feedController.getFeed(req, res));

// POST /api/swipe - Record a swipe action (Right/Left/Up) with EKC 109 escalation & XP
router.post('/swipe', (req, res) => swipeController.handleSwipe(req, res));

// POST /api/problems - Submit a new problem report with photos and geolocation (+50 XP)
router.post('/problems', (req, res) => problemController.createProblem(req, res));

// GET /api/problems - List all problem reports
router.get('/problems', (req, res) => problemController.getProblems(req, res));

// PATCH /api/problems/:id/status - Update problem status (Akimat / 109 dispatcher)
router.patch('/problems/:id/status', (req, res) => problemController.updateStatus(req, res));

// POST /api/feed/reset - Reset swipe history for a user
router.post('/feed/reset', (req, res) => feedController.resetUserSwipes(req, res));

// --- PROMPT 6: AI Clustering & Keyword Prioritization ---
router.post('/ai/analyze-complaint', (req, res) => aiController.analyzeComplaint(req, res));

// --- PROMPT 8: Gamification & Leaderboard ---
router.get('/gamification/leaderboard', (req, res) => gamificationController.getLeaderboard(req, res));
router.post('/gamification/claim-streak', (req, res) => gamificationController.claimDailyStreak(req, res));

// --- PROMPT 10: Synthetic Data Seeder (50+ records) ---
router.post('/demo/seed', (req, res) => seedController.seedDemoData(req, res));

export default router;
