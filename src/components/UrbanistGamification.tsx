import React, { useState, useEffect } from 'react';
import { User, getUserLevelInfo, District, DISTRICT_LABELS } from '../types';
import {
  Trophy,
  Flame,
  Award,
  Shield,
  Zap,
  Leaf,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Gift,
  Star,
  ChevronRight,
  Medal,
  ThumbsUp,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardUser {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl: string;
  district: District;
  xp: number;
  level: number;
  levelTitle: string;
  swipesCount: number;
  reportsCount: number;
  resolvedCount: number;
  badges: Array<{ id: string; name: string; icon: string; desc: string }>;
  weeklyStreak: number;
}

interface UrbanistGamificationProps {
  currentUser: User;
  onXpUpdated?: (newXp: number, newLevel: number) => void;
}

export const UrbanistGamification: React.FC<UrbanistGamificationProps> = ({
  currentUser,
  onXpUpdated,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userXp, setUserXp] = useState(currentUser.xp);
  const [streakDays, setStreakDays] = useState(currentUser.streakDays || 7);
  const [claimedToday, setClaimedToday] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'prizes'>('leaderboard');

  const levelInfo = getUserLevelInfo(userXp);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gamification/leaderboard');
      const json = await res.json();
      if (json.success) {
        setLeaderboard(json.data);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimDailyStreak = async () => {
    if (claimedToday) return;

    try {
      const res = await fetch('/api/gamification/claim-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setUserXp(data.data.totalXp);
        setStreakDays(data.data.streakDays);
        setClaimedToday(true);
        if (onXpUpdated) {
          onXpUpdated(data.data.totalXp, data.data.levelInfo.level);
        }

        // Fire celebration confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const allBadges = [
    {
      id: 'guardian',
      name: 'Страж Аль-Фараби',
      desc: 'Более 50 проверенных заявок в центральном районе',
      icon: Shield,
      unlocked: userXp >= 150,
      color: 'from-sky-500 to-blue-600',
    },
    {
      id: 'anti_hole',
      name: 'Анти-Яма 109',
      desc: 'Устранено 10+ дорожных ям по вашим сигналам',
      icon: Zap,
      unlocked: userXp >= 250,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'eco_hero',
      name: 'Зеленый Шымкент',
      desc: 'Участие в эко-патрулях реки Бадам и озера Тулпар',
      icon: Leaf,
      unlocked: userXp >= 350,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'supervisor',
      name: 'Супервайзер ЕКЦ',
      desc: '100% точность свайпов и верификации фотоотчетов',
      icon: Trophy,
      unlocked: userXp >= 500,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'streak_master',
      name: 'Серийный свайпер',
      desc: 'Непрерывная серия посещений приложения 7+ дней',
      icon: Flame,
      unlocked: streakDays >= 7,
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'legend',
      name: 'Шымкент аңызы',
      desc: 'Топ-1 в городском рейтинге урбанистов (1000+ XP)',
      icon: Star,
      unlocked: userXp >= 1000,
      color: 'from-amber-400 to-yellow-600',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Hero Card with XP & Rank */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-sky-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl -z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                alt={currentUser.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-400/80 shadow-lg bg-slate-800"
              />
              <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-extrabold text-xs px-2 py-0.5 rounded-full border border-white shadow-md">
                Lvl {levelInfo.level}
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30 mb-1">
                <Medal className="w-3.5 h-3.5" />
                <span>{levelInfo.titleRu}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">{currentUser.fullName}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{DISTRICT_LABELS[currentUser.district]?.nameRu || 'Аль-Фарабийский р-н'}</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-semibold">{currentUser.swipesCount || 84} проверенных свайпов</span>
              </p>
            </div>
          </div>

          {/* Daily Streak Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center justify-between md:flex-col md:items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left md:text-right">
                <div className="text-[11px] text-slate-300 uppercase font-semibold">Серия активности</div>
                <div className="text-lg font-bold text-white font-mono">{streakDays} дней подряд</div>
              </div>
            </div>

            <button
              onClick={handleClaimDailyStreak}
              disabled={claimedToday}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                claimedToday
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
              }`}
            >
              {claimedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Получено сегодня</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Забрать +{25 * streakDays} XP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar to Next Rank */}
        <div className="mt-6 pt-6 border-t border-white/10 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">
              Прогресс уровня: <span className="text-white font-mono">{userXp} XP</span>
            </span>
            <span className="text-sky-300 font-mono font-bold">
              {levelInfo.progressPercent}% (до след. ранга: {levelInfo.xpToNextLevel} XP)
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Еженедельный Топ-10 Шымкента</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Достижения и бейджи</span>
        </button>

        <button
          onClick={() => setActiveTab('prizes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'prizes'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Городские призы</span>
        </button>
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Рейтинг лучших урбанистов недели</span>
              </h2>
              <p className="text-xs text-slate-500">
                Период: 12 Авг – 19 Авг 2026 &bull; Обновляется каждые 15 минут
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
              🏆 Призовой фонд активен
            </span>
          </div>

          <div className="space-y-2.5">
            {leaderboard.map((item) => {
              const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;
              const isMe = item.userId === currentUser.id;

              return (
                <div
                  key={item.userId}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-4 ${
                    isMe
                      ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-400'
                      : isFirst
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFirst
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                          : isSecond
                          ? 'bg-slate-300 text-slate-800 shadow'
                          : isThird
                          ? 'bg-amber-700 text-white shadow'
                          : 'bg-slate-200 text-slate-600 font-mono'
                      }`}
                    >
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : item.rank}
                    </div>

                    {/* Avatar */}
                    <img
                      src={item.avatarUrl}
                      alt={item.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                    />

                    {/* Name & Title */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.fullName}</span>
                        {isMe && (
                          <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-bold rounded-full">
                            Вы
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-slate-700">{item.levelTitle}</span>
                        <span>&bull;</span>
                        <span className="text-slate-500">{DISTRICT_LABELS[item.district]?.nameRu || item.district}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-sky-600 font-mono">{item.xp} XP</div>
                    <div className="text-[11px] text-slate-400">
                      {item.swipesCount} свайпов &bull; {item.reportsCount} заявок
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition relative overflow-hidden ${
                  b.unlocked
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                      b.unlocked ? `bg-gradient-to-br ${b.color}` : 'bg-slate-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                      {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.desc}</p>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-wider">
                      {b.unlocked ? (
                        <span className="text-emerald-600 font-semibold">Разблокировано</span>
                      ) : (
                        <span className="text-slate-400">Не разблокировано</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: City Prizes */}
      {activeTab === 'prizes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base">Еженедельные награды от Акимата г. Шымкент</h3>
            <p className="text-xs text-slate-500">
              Выдаются топ-3 урбанистам каждого воскресенья в Ситуационном Центре ЕКЦ 109.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-slate-900 space-y-2">
              <div className="text-2xl">🥇 1 Место</div>
              <div className="font-bold text-sm">Месячный проездной ONAY + Грамота Акима</div>
              <p className="text-xs text-slate-600">
                Бесплатный проезд на всех автобусных маршрутах Шымкента и официальная благодарность акима города.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-900 space-y-2">
              <div className="text-2xl">🥈 2 Место</div>
              <div className="font-bold text-sm">Сертификат Yandex Go 10 000 ₸</div>
              <p className="text-xs text-slate-600">
                Промокод на поездки по Шымкенту для комфортного мониторинга городской среды.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-100/50 border border-amber-700/30 text-slate-900 space-y-2">
              <div className="text-2xl">🥉 3 Место</div>
              <div className="font-bold text-sm">Мерч «Shymkent Smart City»</div>
              <p className="text-xs text-slate-600">
                Фирменное поло, термокружка и эко-сумка почетного урбаниста.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
