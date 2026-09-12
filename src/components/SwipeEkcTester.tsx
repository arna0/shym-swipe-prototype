import React, { useState, useEffect } from 'react';
import {
  Flame,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Send,
  Building2,
  Clock,
  ShieldAlert,
  Sparkles,
  MapPin,
  TrendingUp,
  UserCheck,
  Radio,
  FileCheck,
} from 'lucide-react';
import { CATEGORY_METADATA, DISTRICT_LABELS, ProblemCategory, District, ReportStatus, EKCStatus, SwipeType, USER_LEVEL_TITLES, getUserLevelInfo } from '../types';
import { SwipeResponseDto, EKC109DispatchPayload } from '../server/types';
import { EKC109_ESCALATION_THRESHOLD, DISTRICT_DEPARTMENT_ROUTING } from '../server/services/ekc109Service';

interface ProblemItem {
  id: string;
  title: string;
  category: ProblemCategory;
  district: District;
  address: string;
  swipeRightCount: number;
  swipeLeftCount: number;
  swipeUpCount: number;
  criticalityIndex: number;
  status: ReportStatus;
  ekc109TicketId?: string | null;
  ekc109Status: EKCStatus;
  ekc109ResponseText?: string | null;
}

export const SwipeEkcTester: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'EKC_TICKET' | 'SWIPE_SERVICE_CODE' | 'EKC_SERVICE_CODE'>('SIMULATOR');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('pr-shym-001');
  const [selectedUserId, setSelectedUserId] = useState<string>('usr-shym-001');
  const [lastSwipeResult, setLastSwipeResult] = useState<SwipeResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [userXp, setUserXp] = useState<number>(145);
  const [notification, setNotification] = useState<{ type: 'success' | 'escalation' | 'levelup' | 'error'; message: string } | null>(null);

  // Fetch problems list from feed
  const loadProblems = async () => {
    try {
      const res = await fetch('/api/feed?userId=usr-shym-admin&lat=42.3195&lon=69.5932&radiusKm=20');
      const data = await res.json();
      if (data.success && data.data) {
        setProblems(data.data);
      }
    } catch (e) {
      console.error('Failed to load problems:', e);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleSwipe = async (swipeType: SwipeType) => {
    setLoading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          problemId: selectedProblemId,
          swipeType,
        }),
      });
      const data: SwipeResponseDto = await res.json();

      if (data.success) {
        setLastSwipeResult(data);
        setUserXp(data.data.user.xp);

        // Update local problems state
        setProblems((prev) =>
          prev.map((p) =>
            p.id === selectedProblemId
              ? {
                  ...p,
                  swipeRightCount: data.data.problem.swipeRightCount,
                  swipeLeftCount: data.data.problem.swipeLeftCount,
                  swipeUpCount: data.data.problem.swipeUpCount,
                  criticalityIndex: data.data.problem.criticalityIndex,
                  status: data.data.problem.status,
                  ekc109TicketId: data.data.problem.ekc109TicketId,
                  ekc109Status: data.data.problem.ekc109Status,
                }
              : p
          )
        );

        if (data.data.escalation.thresholdReached && data.data.problem.ekc109Dispatch) {
          setNotification({
            type: 'escalation',
            message: `🔥 ПОРОГ 50 СВАЙПОВ ПРЕВЫШЕН! Статус изменен на «Горячий инцидент». Сформирован официальный тикет ЕКЦ 109 #${data.data.problem.ekc109TicketId}.`,
          });
        } else if (data.data.user.leveledUp) {
          setNotification({
            type: 'levelup',
            message: `🎉 Повышение уровня! Вы достигли уровня ${data.data.user.level} (${data.data.user.levelTitleRu}). Начислено +${data.data.user.earnedXp} XP!`,
          });
        } else {
          setNotification({
            type: 'success',
            message: `✅ Свайп успешно сохранен в базе (Таблица SwipeAction). Начислено +${data.data.user.earnedXp} XP.`,
          });
        }
      } else {
        setNotification({
          type: 'error',
          message: (data as any).message || 'Ошибка обработки свайпа',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Ошибка сети',
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate 50 swipes to trigger instant escalation
  const handleSimulateThreshold = async () => {
    setBatchLoading(true);
    setNotification(null);
    try {
      const currentProb = problems.find((p) => p.id === selectedProblemId);
      const needed = Math.max(1, EKC109_ESCALATION_THRESHOLD - (currentProb?.swipeRightCount || 0));

      // Execute swipe with final trigger
      for (let i = 0; i < needed; i++) {
        const dummyUserId = `usr-sim-${Date.now()}-${i}`;
        const res = await fetch('/api/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: dummyUserId,
            problemId: selectedProblemId,
            swipeType: SwipeType.RIGHT_IMPORTANT,
          }),
        });
        const result: SwipeResponseDto = await res.json();
        if (i === needed - 1 && result.success) {
          setLastSwipeResult(result);
          setNotification({
            type: 'escalation',
            message: `🔥 ПОРОГ 50 СВАЙПОВ ПРЕВЫШЕН! Статус изменен на «Горячий инцидент». Сформирован официальный тикет ЕКЦ 109 #${result.data.problem.ekc109TicketId}.`,
          });
        }
      }
      await loadProblems();
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Ошибка при симуляции порога' });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleResetUserSwipes = async () => {
    try {
      await fetch('/api/feed/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      setNotification({ type: 'success', message: 'История свайпов пользователя сброшена. Теперь можно свайпать повторно.' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentProblem = problems.find((p) => p.id === selectedProblemId) || problems[0];
  const userLevelInfo = getUserLevelInfo(userXp);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.08)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>POST /api/swipe • ЕКЦ 109 Integration • Gamification (+15 XP)</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Обработчик свайпов и <span className="text-cyan-400">эскалация в ЕКЦ 109</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Фиксация голосов жителей в таблице <code className="text-cyan-300 font-mono">SwipeAction</code>, начисление XP с повышением уровня, 
              пересчет индекса критичности и <strong>автоматическая передача заявок в Единый контакт-центр 109</strong> при достижении порога в <strong>50 свайпов вправо</strong>.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'SIMULATOR'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Интерактивный тест POST
            </button>
            <button
              onClick={() => setActiveTab('EKC_TICKET')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'EKC_TICKET'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Тикет ЕКЦ 109 (Open API)
            </button>
            <button
              onClick={() => setActiveTab('SWIPE_SERVICE_CODE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'SWIPE_SERVICE_CODE'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Swipe Service Code
            </button>
            <button
              onClick={() => setActiveTab('EKC_SERVICE_CODE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'EKC_SERVICE_CODE'
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              EKC 109 Service Code
            </button>
          </div>
        </div>

        {/* Gamification Status Bar in Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Награда за свайп</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">+15 XP / +25 XP</div>
            <div className="text-[11px] text-gray-500">Волонтерство: +25 XP</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-orange-400" />
              <span>Текущий уровень</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">
              Lvl {userLevelInfo.level} • {userLevelInfo.titleRu}
            </div>
            <div className="text-[11px] text-gray-500">{userXp} XP (до Lvl {userLevelInfo.level + 1}: {userLevelInfo.xpToNextLevel} XP)</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Порог ЕКЦ 109</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">50 свайпов 👉</div>
            <div className="text-[11px] text-gray-500">«Горячий инцидент»</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Маршрутизация</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">7 управлений</div>
            <div className="text-[11px] text-gray-500">Авто-назначение подрядчиков</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all ${
            notification.type === 'escalation'
              ? 'bg-red-500/15 border-red-500/40 text-red-300 ring-1 ring-red-500/30'
              : notification.type === 'levelup'
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 ring-1 ring-cyan-500/30'
              : notification.type === 'error'
              ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'escalation' ? (
              <Flame className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            ) : notification.type === 'levelup' ? (
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs px-2 py-1 rounded bg-black/40 hover:bg-black/60 text-gray-400"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Swipe Action Simulator (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0e0e11] rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Тестирование POST /api/swipe</h3>
                </div>
                <button
                  onClick={handleResetUserSwipes}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Сбросить свайпы пользователя</span>
                </button>
              </div>

              {/* Select Problem to test */}
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-medium">Выберите городскую проблему для голосования:</label>
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {problems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.id}] {p.title} ({p.swipeRightCount}/50 👉, {DISTRICT_LABELS[p.district]?.ru})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Problem Overview Card */}
              {currentProblem && (
                <div className="bg-black/30 rounded-xl p-5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${CATEGORY_METADATA[currentProblem.category]?.badgeBg}`}>
                      {CATEGORY_METADATA[currentProblem.category]?.labelRu}
                    </span>

                    {currentProblem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD || currentProblem.status === ReportStatus.SENT_TO_109 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-red-500" />
                        Горячий инцидент (В ЕКЦ 109)
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                        {currentProblem.swipeRightCount} / 50 голосов до 109
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-white">{currentProblem.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>{currentProblem.address} ({DISTRICT_LABELS[currentProblem.district]?.kz})</span>
                    </p>
                  </div>

                  {/* Progress towards 50 swipes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Порог эскалации ЕКЦ 109:</span>
                      <span className="text-white font-bold">
                        {currentProblem.swipeRightCount} / {EKC109_ESCALATION_THRESHOLD} ({Math.min(100, Math.round((currentProblem.swipeRightCount / EKC109_ESCALATION_THRESHOLD) * 100))}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          currentProblem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, (currentProblem.swipeRightCount / EKC109_ESCALATION_THRESHOLD) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Live Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-500 text-[10px]">👉 Вправо (Важно)</div>
                      <div className="text-cyan-400 font-bold text-sm mt-0.5">{currentProblem.swipeRightCount}</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-500 text-[10px]">👈 Влево (Неважно)</div>
                      <div className="text-gray-400 font-bold text-sm mt-0.5">{currentProblem.swipeLeftCount}</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="text-gray-500 text-[10px]">Критичность (1-10)</div>
                      <div className="text-orange-400 font-bold text-sm mt-0.5">{currentProblem.criticalityIndex}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Action Buttons for Swipe Types */}
              <div className="space-y-3 pt-2">
                <div className="text-xs text-gray-400 font-medium">Выберите действие свайпа:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSwipe(SwipeType.LEFT_IRRELEVANT)}
                    disabled={loading || batchLoading}
                    className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/20 transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-base">👈</span>
                    <span>Неважно (+15 XP)</span>
                    <span className="text-[10px] text-red-400/80 font-mono">LEFT_IRRELEVANT</span>
                  </button>

                  <button
                    onClick={() => handleSwipe(SwipeType.UP_VOLUNTEER)}
                    disabled={loading || batchLoading}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/20 transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-base">🙋</span>
                    <span>Помогу сам (+25 XP)</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">UP_VOLUNTEER</span>
                  </button>

                  <button
                    onClick={() => handleSwipe(SwipeType.RIGHT_IMPORTANT)}
                    disabled={loading || batchLoading}
                    className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="text-base">👉</span>
                    <span>Важно! (+15 XP)</span>
                    <span className="text-[10px] text-black/70 font-mono">RIGHT_IMPORTANT</span>
                  </button>
                </div>
              </div>

              {/* Fast Forward 50 Swipes simulation button */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white">Симуляция порога 50 свайпов:</div>
                  <div className="text-[11px] text-gray-400">Мгновенно добирает 50 голосов жителей и запускает передачу в ЕКЦ 109</div>
                </div>
                <button
                  onClick={handleSimulateThreshold}
                  disabled={loading || batchLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold text-xs shadow-lg shadow-red-500/20 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Flame className={`w-4 h-4 ${batchLoading ? 'animate-spin' : ''}`} />
                  <span>{batchLoading ? 'Симуляция...' : 'Запустить 50 свайпов'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Server Response & Ticket Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Gamification Card */}
            <div className="bg-[#0e0e11] rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Баланс горожанина</h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {userXp} XP
                </span>
              </div>

              <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400">Текущий ранг:</div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>{userLevelInfo.titleRu} ({userLevelInfo.titleKz})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Уровень:</div>
                    <div className="text-base font-black text-cyan-400 font-mono">Lvl {userLevelInfo.level}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Прогресс уровня</span>
                    <span>{userLevelInfo.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      style={{ width: `${userLevelInfo.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 text-right font-mono">
                    Осталось {userLevelInfo.xpToNextLevel} XP до Lvl {userLevelInfo.level + 1}
                  </div>
                </div>
              </div>
            </div>

            {/* Server JSON Response Preview */}
            <div className="bg-[#0e0e11] rounded-2xl p-6 border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">JSON Ответ сервера POST /api/swipe</h3>
                </div>
                {lastSwipeResult && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(lastSwipeResult, null, 2), 'response')}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'response' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'response' ? 'Скопировано' : 'JSON'}</span>
                  </button>
                )}
              </div>

              <div className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-gray-300 max-h-[300px] overflow-y-auto leading-relaxed">
                {lastSwipeResult ? (
                  <pre className="selection:bg-cyan-500 selection:text-black">
                    {JSON.stringify(lastSwipeResult, null, 2)}
                  </pre>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Нажмите любую кнопку свайпа слева, чтобы отправить реальный запрос на <code className="text-cyan-400">POST /api/swipe</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EKC 109 Ticket Generator View */}
      {activeTab === 'EKC_TICKET' && (
        <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Интеграционный шлюз: Единый контакт-центр 109 г. Шымкент (Open API)</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Структура авто-заявки и матрица маршрутизации подрядчиков
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-3xl">
              При наборе 50 свайпов вправо платформа «Шымкент Свайп» мгновенно формирует стандартизированный инцидент и направляет его в соответствующее управление акимата и подрядную организацию.
            </p>
          </div>

          {/* Departments Routing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {Object.entries(DISTRICT_DEPARTMENT_ROUTING).map(([catKey, routing]) => {
              const meta = CATEGORY_METADATA[catKey as ProblemCategory];
              return (
                <div key={catKey} className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${meta?.badgeBg}`}>
                      {meta?.labelRu}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      SLA: {routing.defaultSlaHours}ч
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Управление акимата:</div>
                    <div className="text-xs font-medium text-white">{routing.department}</div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Исполнитель/Подрядчик:</div>
                    <div className="text-xs text-cyan-300 font-mono">{routing.contractor}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sample JSON Payload */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Пример сформированного JSON-пакета для шлюза 109:</h4>
              <button
                onClick={() => handleCopy(SAMPLE_EKC_PAYLOAD, 'sample_ekc')}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                {copied === 'sample_ekc' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'sample_ekc' ? 'Скопировано' : 'Копировать payload'}</span>
              </button>
            </div>
            <pre className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto leading-relaxed">
              {SAMPLE_EKC_PAYLOAD}
            </pre>
          </div>
        </div>
      )}

      {/* Code Viewer: Swipe Service */}
      {activeTab === 'SWIPE_SERVICE_CODE' && (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-[#0e0e11] px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-200 text-xs font-mono">src/server/services/swipeService.ts</span>
            </div>
            <button
              onClick={() => handleCopy(SWIPE_SERVICE_CODE_STRING, 'swipeService')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10"
            >
              {copied === 'swipeService' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied === 'swipeService' ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>
          <div className="p-6 overflow-x-auto max-h-[600px] text-xs font-mono text-gray-300 leading-relaxed">
            <pre className="selection:bg-cyan-500 selection:text-black">{SWIPE_SERVICE_CODE_STRING}</pre>
          </div>
        </div>
      )}

      {/* Code Viewer: EKC 109 Service */}
      {activeTab === 'EKC_SERVICE_CODE' && (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-[#0e0e11] px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-200 text-xs font-mono">src/server/services/ekc109Service.ts</span>
            </div>
            <button
              onClick={() => handleCopy(EKC_SERVICE_CODE_STRING, 'ekcService')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10"
            >
              {copied === 'ekcService' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied === 'ekcService' ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>
          <div className="p-6 overflow-x-auto max-h-[600px] text-xs font-mono text-gray-300 leading-relaxed">
            <pre className="selection:bg-cyan-500 selection:text-black">{EKC_SERVICE_CODE_STRING}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

const SAMPLE_EKC_PAYLOAD = `{
  "ticketId": "EKC-109-20260818-4921",
  "sourceSystem": "SHYMKENT_SWIPE_OPEN_API",
  "status": "IN_WORK_109",
  "priority": "CRITICAL_HOT_INCIDENT",
  "assignedDepartment": "Управление энергетики и развития инфраструктуры г. Шымкент",
  "contractor": "ГКП «Су ресурстары-Маркетинг» / ГКП «Қуатжылуорталық-3»",
  "estimatedSlaHours": 24,
  "dispatchedAt": "2026-08-18T13:54:29.112Z",
  "problemSummary": {
    "id": "pr-shym-001",
    "title": "Порыв магистрального водопровода возле ТЦ «Shymkent Plaza»",
    "description": "Сильная утечка питьевой воды на проезжей части, затопление полосы движения.",
    "category": "ZHKH",
    "district": "AL_FARABI",
    "address": "пр. Тауке Хана / пл. Аль-Фараби, 3/1",
    "coordinates": {
      "latitude": 42.3195,
      "longitude": 69.5932
    }
  },
  "communityValidation": {
    "thresholdPassed": 50,
    "totalRightSwipes": 51,
    "totalLeftSwipes": 2,
    "totalVolunteerOffers": 3,
    "criticalityScore": 8.95,
    "localCitizenRatioPercent": 88
  }
}`;

const SWIPE_SERVICE_CODE_STRING = `import { ProblemReport, ReportStatus, EKCStatus, SwipeAction, SwipeType, getUserLevelInfo } from '../../types';
import { dbRepository } from '../db/repository';
import { CATEGORY_WEIGHTS } from './feedService';
import { ekc109Service, EKC109_ESCALATION_THRESHOLD } from './ekc109Service';
import { SwipeRequestDto, SwipeResponseDto, EKC109DispatchPayload } from '../types';

export class SwipeService {
  public async processSwipe(dto: SwipeRequestDto): Promise<SwipeResponseDto> {
    const { userId, problemId, swipeType } = dto;

    const problem = dbRepository.getProblemById(problemId);
    if (!problem) throw new Error('Проблема не найдена');

    const user = dbRepository.getUserById(userId);
    if (!user) throw new Error('Пользователь не найден');

    // 1. Проверка на дубликат свайпа
    const swipedIds = dbRepository.getSwipedProblemIdsByUser(userId);
    if (swipedIds.has(problemId)) {
      throw new Error('Вы уже проголосовали по этой заявке.');
    }

    const isLocalUser = user.district === problem.district;
    const swipeWeight = isLocalUser ? 1.5 : 1.0;

    // 2. Обновление счетчиков
    if (swipeType === SwipeType.RIGHT_IMPORTANT || swipeType === SwipeType.UP_VOLUNTEER) {
      problem.swipeRightCount += 1;
    }
    if (swipeType === SwipeType.UP_VOLUNTEER) {
      problem.swipeUpCount += 1;
    }
    if (swipeType === SwipeType.LEFT_IRRELEVANT) {
      problem.swipeLeftCount += 1;
    }
    problem.totalViews += 1;

    // 3. Автоматическая эскалация в ЕКЦ 109 при >= 50 свайпов («Горячий инцидент»)
    let escalationTriggered = false;
    let ekcDispatch: EKC109DispatchPayload | null = null;

    if (problem.swipeRightCount >= EKC109_ESCALATION_THRESHOLD && problem.status !== ReportStatus.SENT_TO_109) {
      escalationTriggered = true;
      problem.status = ReportStatus.SENT_TO_109;
      problem.ekc109Status = EKCStatus.IN_WORK_109;

      const ticket = ekc109Service.generateTicket(problem);
      problem.ekc109TicketId = ticket.ticketId;
      problem.ekc109SyncedAt = new Date().toISOString();
      problem.ekc109ResponseText = ticket.responseText;
      ekcDispatch = ticket.payload;
    }

    // 4. Фиксация в таблице SwipeAction
    const recordedSwipe = dbRepository.recordSwipe({
      userId,
      problemId,
      swipeType,
      weight: swipeWeight,
      isLocalUser,
    });

    // 5. Начисление XP (+15 XP стандарт, +25 XP волонтерство)
    const earnedXp = swipeType === SwipeType.UP_VOLUNTEER ? 25 : 15;
    user.xp += earnedXp;
    user.swipesCount += 1;

    const levelInfo = getUserLevelInfo(user.xp);
    const leveledUp = levelInfo.level > user.level;
    user.level = levelInfo.level;

    return {
      success: true,
      message: escalationTriggered 
        ? 'Горячий инцидент передан в ЕКЦ 109' 
        : \`Голос учтен (+\${earnedXp} XP)\`,
      data: {
        swipe: recordedSwipe,
        problem: { ...problem, isHotIncident: problem.swipeRightCount >= 50, ekc109Dispatch: ekcDispatch },
        user: { ...user, earnedXp, leveledUp, levelTitleRu: levelInfo.titleRu, levelTitleKz: levelInfo.titleKz },
        escalation: {
          thresholdReached: problem.swipeRightCount >= 50,
          currentRightSwipes: problem.swipeRightCount,
          thresholdTarget: 50
        }
      }
    };
  }
}`;

const EKC_SERVICE_CODE_STRING = `import { ProblemReport, ProblemCategory, District, EKCStatus } from '../../types';
import { EKC109DispatchPayload } from '../types';

export const EKC109_ESCALATION_THRESHOLD = 50;

export const DISTRICT_DEPARTMENT_ROUTING: Record<ProblemCategory, { department: string; contractor: string; defaultSlaHours: number }> = {
  [ProblemCategory.ZHKH]: {
    department: 'Управление энергетики и развития инфраструктуры г. Шымкент',
    contractor: 'ГКП «Су ресурстары-Маркетинг» / ГКП «Қуатжылуорталық-3»',
    defaultSlaHours: 24,
  },
  [ProblemCategory.SAFETY]: {
    department: 'Ситуационный центр 109 & Департамент полиции г. Шымкент',
    contractor: 'ТОО «Оңтүстік Жарық Транзит» / Аварийная служба 109',
    defaultSlaHours: 12,
  },
  [ProblemCategory.ROADS]: {
    department: 'Управление пассажирского транспорта и автомобильных дорог г. Шымкент',
    contractor: 'ТОО «ШымкентДорСтрой» / РемДорСервис',
    defaultSlaHours: 48,
  },
  [ProblemCategory.ECOLOGY]: {
    department: 'Департамент экологии & Управление комфортной городской среды',
    contractor: 'ТОО «ЛТД Тұрмыс» / Эко-патруль Шымкента',
    defaultSlaHours: 24,
  },
  [ProblemCategory.TRANSPORT]: {
    department: 'Управление пассажирского транспорта г. Шымкент',
    contractor: 'ТОО «Shymkent Bus» / ТОО «Т-Pass Шымкент»',
    defaultSlaHours: 48,
  },
  [ProblemCategory.ACCESSIBILITY]: {
    department: 'Управление занятости и социальной защиты г. Шымкент',
    contractor: 'Районный отдел инклюзивной инфраструктуры',
    defaultSlaHours: 72,
  },
  [ProblemCategory.LANDSCAPING]: {
    department: 'Аппарат акима района (Шымкент)',
    contractor: 'ГКП «Жасыл қала» / Районные подрядные организации',
    defaultSlaHours: 48,
  },
};

export class EKC109IntegrationService {
  public generateTicket(problem: ProblemReport) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = \`EKC-109-\${dateStr}-\${randomSuffix}\`;

    const routing = DISTRICT_DEPARTMENT_ROUTING[problem.category];
    const slaHours = routing?.defaultSlaHours || 24;

    const payload: EKC109DispatchPayload = {
      ticketId,
      sourceSystem: 'SHYMKENT_SWIPE_OPEN_API',
      status: EKCStatus.IN_WORK_109,
      priority: problem.category === ProblemCategory.ZHKH ? 'CRITICAL_HOT_INCIDENT' : 'HIGH',
      assignedDepartment: routing.department,
      contractor: routing.contractor,
      estimatedSlaHours: slaHours,
      dispatchedAt: new Date().toISOString(),
      problemSummary: { ...problem, coordinates: { latitude: problem.latitude, longitude: problem.longitude } },
      communityValidation: {
        thresholdPassed: EKC109_ESCALATION_THRESHOLD,
        totalRightSwipes: problem.swipeRightCount,
        totalLeftSwipes: problem.swipeLeftCount,
        totalVolunteerOffers: problem.swipeUpCount,
        criticalityScore: problem.criticalityIndex,
        localCitizenRatioPercent: 88,
      }
    };

    return {
      ticketId,
      payload,
      responseText: \`Заявка зарегистрирована в ЕКЦ 109 г. Шымкент под номером #\${ticketId}. Исполнитель: \${routing.contractor}. SLA: \${slaHours}ч.\`
    };
  }
}

export const ekc109Service = new EKC109IntegrationService();`;
