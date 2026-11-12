import React, { useState, useEffect } from 'react';
import {
  Server,
  Play,
  Copy,
  Check,
  MapPin,
  Flame,
  Clock,
  Sparkles,
  RefreshCw,
  Compass,
  Sliders,
  Database,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Trash2,
  ChevronRight,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { CATEGORY_METADATA, DISTRICT_LABELS, District, ProblemCategory } from '../types';
import { FeedResponse, FeedProblemItem } from '../server/types';

// Preset locations in Shymkent
const SHYMKENT_LOCATIONS = [
  {
    name: 'Центр / пр. Тәуке хан (Аль-Фараби)',
    lat: 42.3195,
    lon: 69.5932,
    district: District.AL_FARABI,
  },
  {
    name: 'мкр. Нұрсат / АДЦ (Қаратау)',
    lat: 42.3688,
    lon: 69.6284,
    district: District.KARATAU,
  },
  {
    name: 'мкр. Шымкент-Сити / Тұран',
    lat: 42.3512,
    lon: 69.5388,
    district: District.TURAN,
  },
  {
    name: 'Озеро Тұлпар / Жайлаукөл (Абай)',
    lat: 42.3045,
    lon: 69.5741,
    district: District.ABAY,
  },
  {
    name: 'ул. Қапал батыр / Промзона (Еңбекші)',
    lat: 42.2891,
    lon: 69.6455,
    district: District.ENBEKSHI,
  },
];

const SAMPLE_USERS = [
  {
    id: 'usr-shym-001',
    name: 'Батырхан Сейдалиев',
    district: District.AL_FARABI,
    role: 'Житель Аль-Фарабийского р-на',
  },
  {
    id: 'usr-shym-002',
    name: 'Айгерим Омарова',
    district: District.KARATAU,
    role: 'Житель Каратауского р-на',
  },
];

export const FeedApiTester: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState(SAMPLE_USERS[0].id);
  const [latitude, setLatitude] = useState(42.3195);
  const [longitude, setLongitude] = useState(69.5932);
  const [radiusKm, setRadiusKm] = useState(7.0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'TESTER' | 'SERVICE_CODE' | 'CONTROLLER_CODE' | 'FORMULA'>('TESTER');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FeedResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-fetch feed on component mount or parameter change
  const fetchFeed = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const url = new URL('/api/feed', window.location.origin);
      url.searchParams.append('userId', selectedUser);
      url.searchParams.append('lat', latitude.toString());
      url.searchParams.append('lon', longitude.toString());
      url.searchParams.append('radiusKm', radiusKm.toString());
      if (selectedCategory !== 'ALL') {
        url.searchParams.append('category', selectedCategory);
      }

      const res = await fetch(url.toString());
      const data: FeedResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedUser, latitude, longitude, radiusKm, selectedCategory]);

  const handleSwipeAction = async (problemId: string, swipeType: 'RIGHT_IMPORTANT' | 'LEFT_IRRELEVANT') => {
    setSwipingId(problemId);
    try {
      const res = await fetch('/api/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          problemId,
          swipeType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Свайп ${swipeType === 'RIGHT_IMPORTANT' ? '👉 Вправо (Важно)' : '👈 Влево (Неважно)'} зафиксирован! Проблема исключена из ленты.`);
        // Refresh feed to show exclusion
        fetchFeed();
      }
    } catch (e) {
      console.error('Swipe error:', e);
    } finally {
      setSwipingId(null);
    }
  };

  const handleResetSwipes = async () => {
    try {
      const res = await fetch('/api/feed/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser }),
      });
      const data = await res.json();
      setStatusMessage(data.message || 'История свайпов сброшена.');
      fetchFeed();
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePresetSelect = (loc: (typeof SHYMKENT_LOCATIONS)[0]) => {
    setLatitude(loc.lat);
    setLongitude(loc.lon);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.07)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Server className="w-3.5 h-3.5" />
              <span>Node.js • Express • TypeScript • Haversine Math</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Гео-лента проблем <span className="text-cyan-400">GET /api/feed</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Серверный эндпоинт с умным алгоритмом ранжирования: фильтрация проблем в радиусе до <strong>7 км</strong> по формуле гаверсинусов, 
              исключение уже свайпнутых карточек (<code className="text-cyan-300 font-mono">SwipeAction</code>), учет веса аварийных категорий (ЖКХ, безопасность) и затухание по времени.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('TESTER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'TESTER'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Интерактивный тест
            </button>
            <button
              onClick={() => setActiveTab('SERVICE_CODE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'SERVICE_CODE'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Сервис (Service)
            </button>
            <button
              onClick={() => setActiveTab('CONTROLLER_CODE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'CONTROLLER_CODE'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Контроллер (Controller)
            </button>
            <button
              onClick={() => setActiveTab('FORMULA')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'FORMULA'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Формула ранжирования
            </button>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Радиус отсечения</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">До 7.0 км</div>
            <div className="text-[11px] text-gray-500">Haversine Great Circle</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Анти-дубликаты</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">100% Exclude</div>
            <div className="text-[11px] text-gray-500">Исключение свайпнутых</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Вес категорий</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">ЖКХ 1.5x / Безоп. 1.45x</div>
            <div className="text-[11px] text-gray-500">Приоритет авариям</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Свежесть заявок</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">Half-Life 48ч</div>
            <div className="text-[11px] text-gray-500">Экспоненциальное затухание</div>
          </div>
        </div>
      </div>

      {/* Main Mode Switching */}
      {activeTab === 'TESTER' && (
        <div className="space-y-6">
          {/* Controls & Parameters Bar */}
          <div className="bg-[#0e0e11] rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Параметры запроса GET /api/feed</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetSwipes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  <span>Сбросить свайпы пользователя</span>
                </button>
                <button
                  onClick={fetchFeed}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs shadow-md transition-colors"
                >
                  <Play className={`w-3 h-3 fill-black ${loading ? 'animate-spin' : ''}`} />
                  <span>Выполнить запрос</span>
                </button>
              </div>
            </div>

            {/* Parameter Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Пользователь (userId):</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {SAMPLE_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({DISTRICT_LABELS[u.district].kz})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shymkent Geo Preset */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Пресет геолокации в Шымкенте:</label>
                <select
                  onChange={(e) => {
                    const preset = SHYMKENT_LOCATIONS.find((p) => p.name === e.target.value);
                    if (preset) handlePresetSelect(preset);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {SHYMKENT_LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Радиус фильтрации (radiusKm):</span>
                  <span className="font-mono text-cyan-400 font-bold">{radiusKm} км</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="15.0"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-white/10 rounded-lg h-2 cursor-pointer"
                />
              </div>
            </div>

            {/* Coordinates detail */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-gray-400">
              <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                <span className="text-gray-500">Lat:</span>
                <span className="text-cyan-300 font-semibold">{latitude}</span>
              </div>
              <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                <span className="text-gray-500">Lon:</span>
                <span className="text-cyan-300 font-semibold">{longitude}</span>
              </div>
              <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                <span className="text-gray-500">Эндпоинт:</span>
                <span className="text-emerald-400">
                  GET /api/feed?userId={selectedUser}&lat={latitude}&lon={longitude}&radiusKm={radiusKm}
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">Выдача ленты карточек</h3>
                {response && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                    {response.meta.returnedCount} карточек в радиусе {radiusKm} км ({response.meta.executionTimeMs} ms)
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">Отсортировано по Smart Ranking Score</span>
            </div>

            {loading ? (
              <div className="bg-[#0e0e11] rounded-2xl p-12 text-center border border-white/10">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <div className="text-sm font-medium text-white">Вычисление расстояний Haversine и ранжирование...</div>
              </div>
            ) : !response || response.data.length === 0 ? (
              <div className="bg-[#0e0e11] rounded-2xl p-12 text-center border border-white/10 space-y-3">
                <Compass className="w-10 h-10 text-gray-600 mx-auto" />
                <div className="text-base font-semibold text-white">В радиусе {radiusKm} км нет активных проблем</div>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Возможно, вы уже свайпнули все карточки или задали слишком маленький радиус. Нажмите «Сбросить свайпы» или увеличьте радиус.
                </p>
                <button
                  onClick={handleResetSwipes}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-black font-semibold text-xs mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Сбросить историю свайпов</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.data.map((item, index) => {
                  const catMeta = CATEGORY_METADATA[item.category];
                  const distLabel = DISTRICT_LABELS[item.district];
                  const isTopPriority = index === 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#0e0e11] rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                        isTopPriority
                          ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isTopPriority && (
                        <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          #1 в ленте
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Header: Category & Distance */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium border ${catMeta.badgeBg}`}>
                            {catMeta.labelRu}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.distanceKm} км
                            </span>
                            <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                              Score: {item.rankingScore}
                            </span>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-sm font-semibold text-white leading-snug">{item.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Location Address */}
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>

                        {/* Score Breakdown Bar */}
                        <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Факторы ранжирования:</span>
                            <span className="text-cyan-400 font-mono">W_cat: {item.scoreBreakdown.categoryWeight}x</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                            <div className="bg-white/5 p-1.5 rounded-lg">
                              <div className="text-gray-500">Дистанция</div>
                              <div className="text-white font-semibold">{item.scoreBreakdown.distanceScore}/10</div>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-lg">
                              <div className="text-gray-500">Свежесть</div>
                              <div className="text-white font-semibold">{item.scoreBreakdown.freshnessScore}/10</div>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-lg">
                              <div className="text-gray-500">Свайпы 👉</div>
                              <div className="text-white font-semibold">{item.swipeRightCount}</div>
                            </div>
                            <div className="bg-white/5 p-1.5 rounded-lg">
                              <div className="text-gray-500">Местный р-н</div>
                              <div className="text-cyan-400 font-semibold">{item.scoreBreakdown.localResidentBonus}x</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Swipe Actions for Real API Verification */}
                      <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-gray-500">Симуляция свайпа:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSwipeAction(item.id, 'LEFT_IRRELEVANT')}
                            disabled={swipingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors flex items-center gap-1"
                          >
                            <span>👈 Неважно</span>
                          </button>
                          <button
                            onClick={() => handleSwipeAction(item.id, 'RIGHT_IMPORTANT')}
                            disabled={swipingId === item.id}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span>👉 Важно!</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Viewer: Service */}
      {activeTab === 'SERVICE_CODE' && (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-[#0e0e11] px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-200 text-xs font-mono">src/server/services/feedService.ts</span>
            </div>
            <button
              onClick={() => handleCopyCode(SERVICE_CODE_STRING, 'service')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10"
            >
              {copied === 'service' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied === 'service' ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>
          <div className="p-6 overflow-x-auto max-h-[600px] text-xs font-mono text-gray-300 leading-relaxed">
            <pre className="selection:bg-cyan-500 selection:text-black">{SERVICE_CODE_STRING}</pre>
          </div>
        </div>
      )}

      {/* Code Viewer: Controller */}
      {activeTab === 'CONTROLLER_CODE' && (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-[#0e0e11] px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-200 text-xs font-mono">src/server/controllers/feedController.ts</span>
            </div>
            <button
              onClick={() => handleCopyCode(CONTROLLER_CODE_STRING, 'controller')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10"
            >
              {copied === 'controller' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied === 'controller' ? 'Скопировано' : 'Копировать'}</span>
            </button>
          </div>
          <div className="p-6 overflow-x-auto max-h-[600px] text-xs font-mono text-gray-300 leading-relaxed">
            <pre className="selection:bg-cyan-500 selection:text-black">{CONTROLLER_CODE_STRING}</pre>
          </div>
        </div>
      )}

      {/* Mathematical Formula Explanation */}
      {activeTab === 'FORMULA' && (
        <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Формула Гаверсинусов и Умное Ранжирование Ленты</span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Лента свайпов не является простой сортировкой по времени. Сервер комбинирует 5 фундаментальных параметров городской среды Шымкента:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Haversine Formula Box */}
            <div className="bg-black/40 rounded-xl p-5 border border-white/10 space-y-3">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                1. Формула гаверсинусов (Haversine Distance)
              </h4>
              <div className="bg-white/5 p-3 rounded-lg font-mono text-[11px] text-gray-300 space-y-1">
                <div>a = sin²(Δlat / 2) + cos(lat1) * cos(lat2) * sin²(Δlon / 2)</div>
                <div>c = 2 * atan2(√a, √(1 - a))</div>
                <div className="text-cyan-300 font-bold">d = R_earth * c   (где R_earth = 6371.0 км)</div>
              </div>
              <p className="text-xs text-gray-400">
                Отсекает все точки с <code className="text-cyan-300">d &gt; 7.0 км</code>, вычисляя точную дугу на сфере Земли без ошибок плоской проекции.
              </p>
            </div>

            {/* Smart Ranking Formula Box */}
            <div className="bg-black/40 rounded-xl p-5 border border-white/10 space-y-3">
              <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                2. Интегральный Score карточки
              </h4>
              <div className="bg-white/5 p-3 rounded-lg font-mono text-[11px] text-gray-300 space-y-1">
                <div>Score = [ (Crit * W_cat * 3.5) +</div>
                <div>          (DistScore * 2.5) +</div>
                <div>          (Freshness * 2.0) +</div>
                <div>          (CommunityUrgency * 2.0) ] * LocalBonus</div>
              </div>
              <p className="text-xs text-gray-400">
                Аварийное ЖКХ рядом с пользователем (1-2 км) сразу занимает топ выдачи, даже если создано недавно.
              </p>
            </div>
          </div>

          {/* Category Priority Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Весовые коэффициенты категорий ($W_{'{cat}'}$)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-cyan-400 font-semibold">ЖКХ и сети (ZHKH)</div>
                <div className="text-base font-bold text-white font-mono mt-1">1.50x</div>
                <div className="text-[10px] text-gray-500">Порывы труб, газ, отопление</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-red-400 font-semibold">Безопасность (SAFETY)</div>
                <div className="text-base font-bold text-white font-mono mt-1">1.45x</div>
                <div className="text-[10px] text-gray-500">Открытые люки, обрывы ЛЭП</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-orange-400 font-semibold">Дороги (ROADS)</div>
                <div className="text-base font-bold text-white font-mono mt-1">1.30x</div>
                <div className="text-[10px] text-gray-500">Ямы, провалы на дорогах</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-emerald-400 font-semibold">Экология (ECOLOGY)</div>
                <div className="text-base font-bold text-white font-mono mt-1">1.15x</div>
                <div className="text-[10px] text-gray-500">Стихийные свалки, Бадам</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SERVICE_CODE_STRING = `import { ProblemReport, ProblemCategory, District } from '../../types';
import { dbRepository } from '../db/repository';
import { FeedQueryParams, FeedProblemItem, FeedResponse, RankingScoreBreakdown } from '../types';

export const EARTH_RADIUS_KM = 6371.0;
export const DEFAULT_RADIUS_KM = 7.0;

// Весовые коэффициенты категорий (аварийные коммунальные сети выше)
export const CATEGORY_WEIGHTS: Record<ProblemCategory, number> = {
  [ProblemCategory.ZHKH]: 1.50, // Аварии ЖКХ, порывы труб, отопление
  [ProblemCategory.SAFETY]: 1.45, // Открытые люки, обрывы проводов, свет
  [ProblemCategory.ROADS]: 1.30, // Ямы на проезжей части
  [ProblemCategory.ECOLOGY]: 1.15, // Стихийные свалки, водоохранная зона
  [ProblemCategory.TRANSPORT]: 1.10, // Остановки, автобусы
  [ProblemCategory.ACCESSIBILITY]: 1.05, // Пандусы
  [ProblemCategory.LANDSCAPING]: 1.00, // Благоустройство
};

/**
 * Расчет расстояния по формуле гаверсинусов
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Умная формула ранжирования карточки
 */
export function calculateRankingScore(
  problem: ProblemReport,
  distanceKm: number,
  maxRadiusKm: number,
  userDistrict?: District
): RankingScoreBreakdown {
  const categoryWeight = CATEGORY_WEIGHTS[problem.category] || 1.0;
  const normalizedDist = Math.min(1.0, Math.max(0.0, distanceKm / maxRadiusKm));
  const distanceScore = Number((10.0 * (1.0 - normalizedDist)).toFixed(2));

  const now = Date.now();
  const createdTime = new Date(problem.createdAt).getTime();
  const hoursElapsed = Math.max(0.1, (now - createdTime) / (1000 * 60 * 60));
  const freshnessScore = Number((10.0 * Math.exp(-hoursElapsed / 48)).toFixed(2));

  const rightVotes = problem.swipeRightCount || 0;
  const leftVotes = problem.swipeLeftCount || 0;
  const totalVotes = rightVotes + leftVotes;
  const approvalRatio = totalVotes > 0 ? (rightVotes + 1) / (totalVotes + 1) : 0.5;
  const logVolume = Math.min(5.0, Math.log10(1 + rightVotes) * 2.0);
  const communityUrgencyScore = Number((logVolume * approvalRatio * 2.0).toFixed(2));

  const criticalityBaseScore = problem.criticalityIndex || 5.0;
  const isLocal = userDistrict && problem.district === userDistrict;
  const localResidentBonus = isLocal ? 1.15 : 1.0;

  const rawScore =
    criticalityBaseScore * categoryWeight * 3.5 +
    distanceScore * 2.5 +
    freshnessScore * 2.0 +
    communityUrgencyScore * 2.0;

  const finalScore = Number((rawScore * localResidentBonus).toFixed(2));

  return {
    finalScore,
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceScore,
    categoryWeight,
    criticalityBaseScore,
    communityUrgencyScore,
    freshnessScore,
    localResidentBonus,
  };
}

export class FeedService {
  public async getPersonalizedFeed(params: FeedQueryParams): Promise<FeedResponse> {
    const { userId, lat, lon, radiusKm = DEFAULT_RADIUS_KM, limit = 20, offset = 0 } = params;
    const user = dbRepository.getUserById(userId);
    const swipedProblemIds = dbRepository.getSwipedProblemIdsByUser(userId);
    const allActiveProblems = dbRepository.getAllActiveProblems();

    const candidateItems: FeedProblemItem[] = [];

    for (const problem of allActiveProblems) {
      // Исключаем уже свайпнутые карточки
      if (swipedProblemIds.has(problem.id)) continue;

      // Вычисляем расстояние
      const distanceKm = calculateHaversineDistance(lat, lon, problem.latitude, problem.longitude);
      if (distanceKm > radiusKm) continue;

      // Рассчитываем скор
      const scoreBreakdown = calculateRankingScore(problem, distanceKm, radiusKm, user?.district);
      candidateItems.push({
        ...problem,
        distanceKm: scoreBreakdown.distanceKm,
        rankingScore: scoreBreakdown.finalScore,
        scoreBreakdown,
        isWithinRadius: true,
      });
    }

    // Сортировка по убыванию умного рейтинга
    candidateItems.sort((a, b) => b.rankingScore - a.rankingScore);

    return {
      success: true,
      meta: {
        totalAvailable: candidateItems.length,
        returnedCount: candidateItems.slice(offset, offset + limit).length,
        radiusKm,
        userLocation: { latitude: lat, longitude: lon },
        pagination: { limit, offset, hasMore: offset + limit < candidateItems.length },
      },
      data: candidateItems.slice(offset, offset + limit),
    };
  }
}`;

const CONTROLLER_CODE_STRING = `import { Request, Response } from 'express';
import { feedService, DEFAULT_RADIUS_KM } from '../services/feedService';
import { ProblemCategory, District } from '../../types';

export class FeedController {
  public async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const { userId, lat, lon, radiusKm, limit, offset, category, district } = req.query;

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ success: false, message: 'Параметр "userId" обязателен.' });
        return;
      }
      if (lat === undefined || lon === undefined) {
        res.status(400).json({ success: false, message: 'Координаты "lat" и "lon" обязательны.' });
        return;
      }

      const parsedLat = parseFloat(lat as string);
      const parsedLon = parseFloat(lon as string);
      if (isNaN(parsedLat) || isNaN(parsedLon)) {
        res.status(400).json({ success: false, message: 'Координаты должны быть числами.' });
        return;
      }

      const feed = await feedService.getPersonalizedFeed({
        userId: userId.trim(),
        lat: parsedLat,
        lon: parsedLon,
        radiusKm: radiusKm ? parseFloat(radiusKm as string) : DEFAULT_RADIUS_KM,
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
        category: category as ProblemCategory,
        district: district as District,
      });

      res.status(200).json(feed);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  }
}`;
