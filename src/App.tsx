import React, { useState, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { ReportProblemScreen } from './components/ReportProblemScreen';
import { SwipeEkcTester } from './components/SwipeEkcTester';
import { FeedApiTester } from './components/FeedApiTester';
import { SchemaViewer } from './components/SchemaViewer';
import { ERDiagram } from './components/ERDiagram';
import { SwipeSimulator } from './components/SwipeSimulator';
import { AkimatDashboard } from './components/AkimatDashboard';
import { AiClusteringTester } from './components/AiClusteringTester';
import { UrbanistGamification } from './components/UrbanistGamification';
import { TelegramMiniAppView } from './components/TelegramMiniAppView';
import { IndexExplanation } from './components/IndexExplanation';
import { CodeSnippets } from './components/CodeSnippets';
import { 
  INITIAL_CURRENT_USER, 
  INITIAL_PROBLEMS, 
  INITIAL_DISTRICT_ANALYTICS 
} from './data/mockData';
import { ProblemReport, User, DistrictAnalytics, SwipeType } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('simulator');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_CURRENT_USER);
  const [problems, setProblems] = useState<ProblemReport[]>(INITIAL_PROBLEMS);
  const [analytics, setAnalytics] = useState<DistrictAnalytics[]>(INITIAL_DISTRICT_ANALYTICS);
  const [seedNotification, setSeedNotification] = useState<string | null>(null);

  // Initial fetch of problems from backend
  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await fetch('/api/problems');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setProblems(data.data);
      }
    } catch (e) {
      console.log('Using local initial problems', e);
    }
  };

  const handleProblemCreated = (newProb: ProblemReport) => {
    setProblems((prev) => [newProb, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      xp: prev.xp + 50,
      reportsCount: (prev.reportsCount || 0) + 1,
    }));
  };

  const handleSwipe = async (problemId: string, type: SwipeType) => {
    try {
      await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          problemId,
          swipeType: type,
        }),
      });

      // Update local state
      setProblems((prev) =>
        prev.map((p) => {
          if (p.id === problemId) {
            const isRight = type === SwipeType.RIGHT_IMPORTANT || type === SwipeType.UP_VOLUNTEER;
            const isLeft = type === SwipeType.LEFT_IRRELEVANT;
            const newRight = p.swipeRightCount + (isRight ? 1 : 0);
            const newLeft = p.swipeLeftCount + (isLeft ? 1 : 0);
            const ratio = (newRight / (newRight + newLeft || 1)) * 10;
            return {
              ...p,
              swipeRightCount: newRight,
              swipeLeftCount: newLeft,
              criticalityIndex: Number(Math.min(10, Math.max(1, ratio)).toFixed(2)),
            };
          }
          return p;
        })
      );

      // Award XP
      const addedXp = type === SwipeType.UP_VOLUNTEER ? 25 : 10;
      setCurrentUser((prev) => ({
        ...prev,
        xp: prev.xp + addedXp,
        swipesCount: (prev.swipesCount || 0) + 1,
      }));
    } catch (e) {
      console.error('Failed to record swipe', e);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchProblems();
        setSeedNotification('🚀 Загружено 50+ реалистичных точек по 5 районам Шымкента для демонстрации!');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b'],
        });
        setTimeout(() => setSeedNotification(null), 4000);
      }
    } catch (e) {
      console.error('Failed to seed demo data', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-[#e2e8f0] flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950">
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSeedDemoData={handleSeedDemoData}
      />

      {/* Global Seed Notification Banner */}
      {seedNotification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold py-2.5 px-4 text-center shadow-lg animate-pulse flex items-center justify-center gap-2">
          <span>✨</span>
          <span>{seedNotification}</span>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
        {activeTab === 'simulator' && (
          <SwipeSimulator
            problems={problems}
            setProblems={setProblems}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
          />
        )}

        {activeTab === 'report-problem' && (
          <ReportProblemScreen
            onProblemCreated={handleProblemCreated}
            onNavigateToFeed={() => setActiveTab('simulator')}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onNavigateToAkimat={() => setActiveTab('akimat')}
          />
        )}

        {activeTab === 'ai_cluster' && <AiClusteringTester />}

        {activeTab === 'akimat' && (
          <AkimatDashboard
            analytics={analytics}
            problems={problems}
            onSeedDemoData={handleSeedDemoData}
            onRefresh={fetchProblems}
          />
        )}

        {activeTab === 'gamification' && (
          <UrbanistGamification
            currentUser={currentUser}
            onXpUpdated={(newXp, newLevel) => {
              setCurrentUser((prev) => ({ ...prev, xp: newXp, level: newLevel }));
            }}
          />
        )}

        {activeTab === 'tma' && (
          <TelegramMiniAppView
            currentUser={currentUser}
            problems={problems}
            onSwipe={handleSwipe}
            onOpenReportModal={() => setActiveTab('report-problem')}
          />
        )}

        {activeTab === 'swipe-api' && <SwipeEkcTester />}
        {activeTab === 'feed-api' && <FeedApiTester />}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <SchemaViewer />
            <ERDiagram />
            <IndexExplanation />
            <CodeSnippets />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050810] py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">Шымкент Свайп 109 &bull; Smart City</span>
            <span>&bull;</span>
            <span className="text-sky-400">FastAPI AI + Node.js + Telegram WebApp SDK</span>
          </div>
          <div>
            5 районов: Абай, Әл-Фараби, Еңбекші, Қаратау, Тұран &bull; Прямой шлюз ЕКЦ 109
          </div>
        </div>
      </footer>
    </div>
  );
}
