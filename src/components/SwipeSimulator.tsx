import React, { useState } from 'react';
import { 
  ProblemReport, 
  User, 
  District, 
  DISTRICT_LABELS, 
  CATEGORY_METADATA, 
  SwipeType, 
  ReportStatus, 
  EKCStatus 
} from '../types';
import { 
  Heart, 
  X, 
  HandHeart, 
  MapPin, 
  Flame, 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SwipeSimulatorProps {
  problems: ProblemReport[];
  setProblems: React.Dispatch<React.SetStateAction<ProblemReport[]>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
}

export const SwipeSimulator: React.FC<SwipeSimulatorProps> = ({
  problems,
  setProblems,
  currentUser,
  setCurrentUser,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'ALL'>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{
    type: SwipeType;
    xpGained: number;
    problemTitle: string;
    newCriticality: number;
    ekcEscalated: boolean;
    isLocal: boolean;
  } | null>(null);

  // Filter problems by district
  const filteredProblems = problems.filter(
    (p) => selectedDistrict === 'ALL' || p.district === selectedDistrict
  );

  const activeProblem = filteredProblems[currentIndex % (filteredProblems.length || 1)];

  const handleSwipe = (type: SwipeType) => {
    if (!activeProblem) return;

    const isLocal = currentUser.district === activeProblem.district;
    const voteWeight = (isLocal ? 1.5 : 1.0) * currentUser.reputationScore;

    // Recalculate counters
    const rightInc = type === SwipeType.RIGHT_IMPORTANT ? 1 : 0;
    const leftInc = type === SwipeType.LEFT_IRRELEVANT ? 1 : 0;
    const upInc = type === SwipeType.UP_VOLUNTEER ? 1 : 0;

    const updatedRight = activeProblem.swipeRightCount + rightInc;
    const updatedLeft = activeProblem.swipeLeftCount + leftInc;
    const updatedUp = activeProblem.swipeUpCount + upInc;
    const totalSwipes = updatedRight + updatedLeft + updatedUp;

    // Automatic Criticality calculation formula
    const categoryWeights: Record<string, number> = {
      SAFETY: 1.4,
      ZHKH: 1.2,
      ROADS: 1.1,
      ECOLOGY: 1.0,
      TRANSPORT: 1.0,
      LANDSCAPING: 0.9,
      ACCESSIBILITY: 1.1,
    };
    const catMultiplier = categoryWeights[activeProblem.category] || 1.0;
    const approvalRatio = totalSwipes > 0 ? (updatedRight * 1.0 + updatedUp * 1.2) / totalSwipes : 0;
    const volumeBonus = Math.min(Math.log10(totalSwipes + 1) * 2.5, 3.5);
    const newCriticality = Math.min(10.0, +(approvalRatio * 6.5 * catMultiplier + volumeBonus).toFixed(2));

    // Auto-escalation to EKC 109 if criticality index >= 7.5
    let newStatus = activeProblem.status;
    let newEkcStatus = activeProblem.ekc109Status;
    let ekcEscalated = false;

    if (newCriticality >= 7.5 && activeProblem.status === ReportStatus.NEW) {
      newStatus = ReportStatus.SENT_TO_109;
      newEkcStatus = EKCStatus.IN_WORK_109;
      ekcEscalated = true;
    }

    // Award XP
    const xpGained = type === SwipeType.UP_VOLUNTEER ? 50 : 10;
    const newXp = currentUser.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;

    // Update Problem State
    setProblems((prev) =>
      prev.map((p) =>
        p.id === activeProblem.id
          ? {
              ...p,
              swipeRightCount: updatedRight,
              swipeLeftCount: updatedLeft,
              swipeUpCount: updatedUp,
              criticalityIndex: newCriticality,
              status: newStatus,
              ekc109Status: newEkcStatus,
              ekc109TicketId: ekcEscalated ? `EKC-109-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : p.ekc109TicketId,
            }
          : p
      )
    );

    // Update User State
    setCurrentUser((prev) => ({
      ...prev,
      xp: newXp,
      level: newLevel,
      swipesCount: prev.swipesCount + 1,
    }));

    // Record last action for feedback
    setLastAction({
      type,
      xpGained,
      problemTitle: activeProblem.title,
      newCriticality,
      ekcEscalated,
      isLocal,
    });

    // Advance to next card
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Mode Switcher Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-5 sm:p-6 border border-sky-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Шымкент Smart City 2026 &bull; Гражданский краудсорсинг</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Городская лента оценки дефектов (Шымкент Свайп)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Свайпайте вправо <strong className="text-emerald-400">«Важно (+10 XP)»</strong>, влево <strong className="text-slate-400">«Пропуск»</strong> или вверх <strong className="text-purple-300">«Волонтер (+50 XP)»</strong>. При критичности 7.5+ заявка автоматически передается в ЕКЦ 109.
            </p>
          </div>

          {/* Action counter */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 px-4 rounded-xl border border-white/15">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300 font-black text-lg">
              {filteredProblems.length}
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase font-semibold">Активных заявок</div>
              <div className="text-xs font-bold text-white font-mono">
                {selectedDistrict === 'ALL' ? 'По всему городу' : DISTRICT_LABELS[selectedDistrict]?.ru}
              </div>
            </div>
          </div>
        </div>

        {/* District Filter Chips Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 relative z-10">
          <span className="text-xs font-semibold text-slate-300 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            Районы:
          </span>
          <button
            onClick={() => { setSelectedDistrict('ALL'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDistrict === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
          >
            🏙️ Весь Шымкент ({problems.length})
          </button>
          {Object.values(District).map((d) => {
            const count = problems.filter((p) => p.district === d).length;
            return (
              <button
                key={d}
                onClick={() => { setSelectedDistrict(d); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDistrict === d
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                }`}
              >
                {DISTRICT_LABELS[d]?.ru.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3-Column Mathematically Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Current Report Inspector & Criticality Gauge (lg:col-span-3) */}
        <aside className="lg:col-span-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-6 shadow-xl">
          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Параметры дефекта</span>
            </h3>
            {activeProblem ? (
              <div className="space-y-3">
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-400 font-mono font-bold">
                      #{activeProblem.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                      {activeProblem.authorName}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                    {activeProblem.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                    {activeProblem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Категория</span>
                    <span className="text-xs font-bold text-white mt-0.5 block truncate">
                      {CATEGORY_METADATA[activeProblem.category]?.labelRu || 'ЖКХ'}
                    </span>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-semibold">Район</span>
                    <span className="text-xs font-bold text-white mt-0.5 block truncate">
                      {DISTRICT_LABELS[activeProblem.district]?.ru?.split(' ')[0] || 'Аль-Фараби'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    Адрес (OSM)
                  </span>
                  <span className="text-xs text-slate-200 truncate block mt-1 font-medium">
                    {activeProblem.address}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">Нет активных данных</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Индекс аварийности</span>
            </h3>
            {activeProblem && (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {activeProblem.criticalityIndex.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">из 10.00</span>
                </div>
                
                {/* Segmented Criticality Bars */}
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
                    const filled = activeProblem.criticalityIndex >= step;
                    const isHigh = step >= 8;
                    return (
                      <div
                        key={step}
                        className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                          filled
                            ? isHigh
                              ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                              : 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                            : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <span>Порог 109: <strong>7.50</strong></span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    activeProblem.criticalityIndex >= 7.5
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {activeProblem.criticalityIndex >= 7.5 ? 'Эскалировано в 109' : 'Сбор голосов'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center Column: The Primary Interactive Swipe Card (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative w-full">
          {filteredProblems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 w-full shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-sky-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Все проблемы в выбранном районе просмотрены</h3>
              <p className="text-xs text-slate-400 mt-1">Переключите фильтр района или выберите "Весь Шымкент".</p>
              <button
                onClick={() => setSelectedDistrict('ALL')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition shadow-lg"
              >
                Показать весь город
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProblem.id}
                  initial={{ scale: 0.96, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900 rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col relative z-10"
                >
                  {/* Photo Container */}
                  <div className="h-72 sm:h-80 bg-slate-950 relative overflow-hidden">
                    <img
                      src={activeProblem.photoUrls[0]}
                      alt={activeProblem.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60 z-10" />

                    {/* NEW / Status Badge */}
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${activeProblem.criticalityIndex >= 7.5 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                        {activeProblem.status === ReportStatus.SENT_TO_109 ? 'В ЕКЦ 109' : 'ГОЛОСОВАНИЕ'}
                      </span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md bg-slate-900/80 text-sky-300 border-sky-400/40">
                        {CATEGORY_METADATA[activeProblem.category]?.labelRu || 'Городской дефект'}
                      </span>
                    </div>

                    {/* District & Location Bottom */}
                    <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sky-200 text-xs font-bold drop-shadow">
                        <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="truncate">{DISTRICT_LABELS[activeProblem.district]?.ru || activeProblem.district}</span>
                      </div>
                      {activeProblem.ekc109TicketId && (
                        <span className="text-[11px] font-mono font-bold text-amber-300 bg-black/80 px-2.5 py-0.5 rounded-md border border-amber-500/40 shadow">
                          {activeProblem.ekc109TicketId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content & Action Buttons */}
                  <div className="p-5 sm:p-6 flex flex-col gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 leading-snug">
                        {activeProblem.title}
                      </h2>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                        {activeProblem.description}
                      </p>
                    </div>

                    {/* Action Buttons: Clear, Symmetrical, Aligned */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-3">
                        {/* Dislike / Left */}
                        <button
                          onClick={() => handleSwipe(SwipeType.LEFT_IRRELEVANT)}
                          className="w-14 h-14 rounded-2xl border border-red-500/40 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all shadow-md"
                          title="Свайп ВЛЕВО: Не важно"
                        >
                          <X className="w-6 h-6" />
                        </button>

                        {/* Like / Right */}
                        <button
                          onClick={() => handleSwipe(SwipeType.RIGHT_IMPORTANT)}
                          className="w-14 h-14 rounded-2xl border border-emerald-500/40 flex items-center justify-center bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all shadow-lg"
                          title="Свайп ВПРАВО: Важно (+10 XP)"
                        >
                          <Heart className="w-6 h-6 fill-emerald-400/20" />
                        </button>
                      </div>

                      {/* Volunteer Button */}
                      <button
                        onClick={() => handleSwipe(SwipeType.UP_VOLUNTEER)}
                        className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all shadow-lg flex items-center gap-2"
                      >
                        <HandHeart className="w-4 h-4 text-purple-200" />
                        <span>Помогу (+50 XP)</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Swipe Direction Labels */}
              <div className="flex justify-between mt-4 text-slate-400 text-[11px] uppercase tracking-wider font-bold px-3">
                <span className="text-red-400">← Пропуск</span>
                <span className="text-purple-300">Помогу ↑</span>
                <span className="text-emerald-400">Важно →</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time District Activity & 109 Link (lg:col-span-3) */}
        <aside className="lg:col-span-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-6 shadow-xl">
          {/* Last Action Notification */}
          {lastAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/80 rounded-xl p-3.5 border border-sky-500/40 text-xs space-y-1.5 shadow"
            >
              <div className="flex items-center justify-between text-sky-300 font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Голос зафиксирован
                </span>
                <span className="font-mono text-emerald-400 font-bold">+{lastAction.xpGained} XP</span>
              </div>
              <p className="text-slate-200 text-xs truncate font-medium">
                {lastAction.problemTitle}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700">
                <span>Индекс: <strong className="text-white font-mono">{lastAction.newCriticality}</strong></span>
                {lastAction.isLocal && <span className="text-emerald-400 font-semibold">1.5x Вес жителя</span>}
              </div>
            </motion.div>
          )}

          <div>
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Активность районов</span>
            </h3>
            <div className="space-y-3.5">
              {Object.values(District).map((d) => {
                const count = problems.filter((p) => p.district === d).length;
                const rightVotes = problems
                  .filter((p) => p.district === d)
                  .reduce((acc, curr) => acc + curr.swipeRightCount, 0);
                const percent = Math.min(100, Math.round((rightVotes / 50) * 100));

                return (
                  <div key={d} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{DISTRICT_LABELS[d]?.ru?.split(' ')[0]}</span>
                      <span className="font-mono text-slate-400 text-[11px] font-bold">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          percent > 70 ? 'bg-amber-400' : 'bg-sky-400'
                        }`}
                        style={{ width: `${Math.max(8, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Шлюз ЕКЦ 109</span>
            </h3>
            <div className="flex items-center gap-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-xs text-emerald-300 font-bold">Синхронизация активна</span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-300">
              <span>Заявок в работе</span>
              <span className="text-white font-mono font-bold">
                {problems.filter((p) => p.status === ReportStatus.SENT_TO_109).length + 142}
              </span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};
