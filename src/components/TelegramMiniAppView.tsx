import React, { useState, useEffect } from 'react';
import { ProblemReport, User, SwipeType, DISTRICT_LABELS, CATEGORY_METADATA } from '../types';
import {
  Send,
  Sparkles,
  Heart,
  X,
  Flame,
  CheckCircle2,
  MapPin,
  Shield,
  PhoneCall,
  Layers,
  Smartphone,
  Moon,
  Sun,
  Vibrate,
  Info,
  ChevronLeft,
  MoreVertical,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TelegramMiniAppViewProps {
  currentUser: User;
  problems: ProblemReport[];
  onSwipe: (problemId: string, type: SwipeType) => Promise<void>;
  onOpenReportModal: () => void;
}

export const TelegramMiniAppView: React.FC<TelegramMiniAppViewProps> = ({
  currentUser,
  problems,
  onSwipe,
  onOpenReportModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTelegramDark, setIsTelegramDark] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const activeProblems = problems.filter(
    (p) => p.status !== 'RESOLVED' && p.status !== 'REJECTED'
  );
  const currentProblem = activeProblems[currentIndex];

  const triggerTelegramHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
    if (!hapticEnabled) return;
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        if (type === 'success') {
          tg.HapticFeedback.notificationOccurred('success');
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } else if (navigator.vibrate) {
        navigator.vibrate(type === 'heavy' ? 40 : 20);
      }
    } catch (e) {
      console.log('Haptic simulation');
    }
  };

  const handleSwipeAction = async (type: SwipeType) => {
    if (!currentProblem) return;

    if (type === SwipeType.RIGHT_IMPORTANT) {
      triggerTelegramHaptic('heavy');
      setLastAction('🔥 Отмечено как «Важно для города» (+10 XP)');
    } else if (type === SwipeType.UP_VOLUNTEER) {
      triggerTelegramHaptic('success');
      setLastAction('💪 Заявка на волонтерство (+25 XP)');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } else {
      triggerTelegramHaptic('light');
      setLastAction('👎 Пропущено как неактуальное');
    }

    await onSwipe(currentProblem.id, type);
    setCurrentIndex((prev) => prev + 1);

    setTimeout(() => setLastAction(null), 2500);
  };

  return (
    <div className="max-w-md mx-auto p-2 sm:p-4 space-y-4">
      {/* TMA Mode Control Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>Промпт 9: Telegram Mini App (TMA)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`p-1.5 rounded-lg border transition ${
              hapticEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title="Telegram Haptic Feedback"
          >
            <Vibrate className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsTelegramDark(!isTelegramDark)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Переключить тему Telegram"
          >
            {isTelegramDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Simulated Telegram Mini App Window Container */}
      <div
        className={`rounded-[32px] overflow-hidden border-4 shadow-2xl transition-colors duration-300 ${
          isTelegramDark
            ? 'bg-[#17212b] border-[#0e1621] text-[#f5f5f5]'
            : 'bg-[#ffffff] border-[#e4e8ec] text-[#222222]'
        }`}
        style={{ minHeight: '620px' }}
      >
        {/* Telegram Top Navigation Bar */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between ${
            isTelegramDark
              ? 'bg-[#242f3d] border-[#17212b] text-white'
              : 'bg-[#517da2] border-[#446c8d] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-tight">Шымкент Свайп 109</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-300 fill-sky-300 text-slate-900" />
              </div>
              <div className="text-[10px] text-white/70">бот &bull; ЕКЦ 109 & Акимат</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MoreVertical className="w-4 h-4 opacity-80 cursor-pointer" />
            <X className="w-4 h-4 opacity-80 cursor-pointer" />
          </div>
        </div>

        {/* Telegram App Body */}
        <div className="p-4 space-y-4">
          {/* User Status Strip */}
          <div
            className={`p-2.5 rounded-2xl flex items-center justify-between text-xs ${
              isTelegramDark
                ? 'bg-[#242f3d] border border-[#2b3a4a]'
                : 'bg-slate-100 border border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{currentUser.fullName}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sky-400 font-bold">{currentUser.xp} XP</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                Lvl {currentUser.level || 4}
              </span>
            </div>
          </div>

          {/* Action Notification Toast */}
          {lastAction && (
            <div className="p-2.5 rounded-xl bg-sky-600 text-white text-xs font-semibold text-center shadow-md">
              {lastAction}
            </div>
          )}

          {/* Swipe Card Deck */}
          {currentProblem ? (
            <div
              className={`rounded-2xl overflow-hidden border shadow-lg transition flex flex-col justify-between ${
                isTelegramDark
                  ? 'bg-[#242f3d] border-[#2b3a4a]'
                  : 'bg-slate-50 border-slate-200'
              }`}
              style={{ minHeight: '440px' }}
            >
              {/* Photo Area */}
              <div className="relative h-56 w-full overflow-hidden bg-slate-800">
                <img
                  src={
                    currentProblem.photoUrls && currentProblem.photoUrls.length > 0
                      ? currentProblem.photoUrls[0]
                      : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={currentProblem.title}
                  className="w-full h-full object-cover"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-bold text-white border border-white/20">
                    {DISTRICT_LABELS[currentProblem.district]?.nameRu || currentProblem.district}
                  </span>

                  <span className="px-2.5 py-1 bg-red-600/90 backdrop-blur-md rounded-full text-[11px] font-bold text-white shadow">
                    🔥 {currentProblem.criticalityIndex.toFixed(1)} / 10
                  </span>
                </div>

                {/* Bottom Address on Photo */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[11px] flex items-center gap-1 text-slate-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{currentProblem.address}</span>
                  </div>
                </div>
              </div>

              {/* Text Description */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm leading-snug">
                  {currentProblem.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed line-clamp-3 ${
                    isTelegramDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {currentProblem.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] opacity-75">
                  <span>👍 {currentProblem.swipeRightCount} голосов жителей</span>
                  <span>{currentProblem.category}</span>
                </div>
              </div>

              {/* TMA Fast Action Buttons */}
              <div
                className={`p-3 border-t grid grid-cols-3 gap-2 ${
                  isTelegramDark ? 'border-[#1f2a37]' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => handleSwipeAction(SwipeType.LEFT_IRRELEVANT)}
                  className="py-2.5 px-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>Пропуск</span>
                </button>

                <button
                  onClick={() => handleSwipeAction(SwipeType.UP_VOLUNTEER)}
                  className="py-2.5 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Помогу</span>
                </button>

                <button
                  onClick={() => handleSwipeAction(SwipeType.RIGHT_IMPORTANT)}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-md"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Важно!</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`p-8 rounded-2xl border text-center space-y-4 flex flex-col items-center justify-center ${
                isTelegramDark ? 'bg-[#242f3d] border-[#2b3a4a]' : 'bg-slate-50 border-slate-200'
              }`}
              style={{ minHeight: '380px' }}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base">Все заявки проверены!</h3>
                <p className="text-xs opacity-75 mt-1">
                  Вы просмотрели всю актуальную гео-ленту в радиусе вашего района.
                </p>
              </div>
              <button
                onClick={() => setCurrentIndex(0)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
              >
                Смотреть заново
              </button>
            </div>
          )}

          {/* Telegram Native MainButton at Bottom */}
          <button
            onClick={onOpenReportModal}
            className="w-full py-3.5 bg-[#2481cc] hover:bg-[#2072b4] text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>СООБЩИТЬ О ПРОБЛЕМЕ В ЕКЦ 109 (+50 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
