import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  District,
  DISTRICT_LABELS,
  DistrictAnalytics,
  ProblemReport,
  ProblemCategory,
  CATEGORY_METADATA,
  ReportStatus,
} from '../types';
import {
  Building2,
  Users,
  Clock,
  Flame,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
  PhoneCall,
  CheckCheck,
  ChevronRight,
  Eye,
  Camera,
  ThumbsUp,
  X,
  FileCheck,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Custom Leaflet Pin Generator based on criticality
const createCustomPin = (criticality: number, isResolved: boolean) => {
  let bgColor = '#ef4444'; // Red
  let label = criticality.toFixed(1);

  if (isResolved) {
    bgColor = '#10b981'; // Green
    label = '✓';
  } else if (criticality < 5.5) {
    bgColor = '#0ea5e9'; // Blue
  } else if (criticality < 8.0) {
    bgColor = '#f59e0b'; // Amber
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border-radius: 9999px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 11px;
        font-family: sans-serif;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

interface AkimatDashboardProps {
  analytics: DistrictAnalytics[];
  problems: ProblemReport[];
  onRefresh?: () => void;
  onSeedDemoData?: () => void;
}

export const AkimatDashboard: React.FC<AkimatDashboardProps> = ({
  analytics,
  problems,
  onRefresh,
  onSeedDemoData,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<District | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activePhotoModal, setActivePhotoModal] = useState<ProblemReport | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [localProblems, setLocalProblems] = useState<ProblemReport[]>(problems);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Sync with prop when problems update
  useEffect(() => {
    setLocalProblems(problems);
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return localProblems.filter((p) => {
      const matchesDistrict = selectedDistrict === 'ALL' || p.district === selectedDistrict;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.ekc109TicketId && p.ekc109TicketId.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDistrict && matchesStatus && matchesCategory && matchesSearch;
    });
  }, [localProblems, selectedDistrict, statusFilter, categoryFilter, searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [42.3195, 69.5932],
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on filteredProblems change
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredProblems.forEach((p) => {
      const isResolved = p.status === ReportStatus.RESOLVED;
      const icon = createCustomPin(p.criticalityIndex, isResolved);
      const marker = L.marker([p.latitude, p.longitude], { icon });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; padding: 2px; max-width: 240px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.title}</div>
          <div style="color: #475569; margin-bottom: 6px;">${p.description}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📍 ${p.address}</div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <span>👍 ${p.swipeRightCount} голосов</span>
            <span style="color: #0284c7;">${p.criticalityIndex.toFixed(1)}/10</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredProblems]);

  // City KPIs
  const totalReportsCount = localProblems.length;
  const criticalReportsCount = localProblems.filter((p) => p.criticalityIndex >= 8.0).length;
  const resolvedCount = localProblems.filter((p) => p.status === ReportStatus.RESOLVED).length;
  const totalSwipes = localProblems.reduce((acc, p) => acc + p.swipeRightCount + p.swipeLeftCount + p.swipeUpCount, 0);

  // Chart 1: Problems by 5 Districts
  const districtChartData = useMemo(() => {
    const districts = [
      District.AL_FARABI,
      District.KARATAU,
      District.ENBEKSHI,
      District.ABAY,
      District.TURAN,
    ];
    const counts = districts.map((d) => localProblems.filter((p) => p.district === d).length);
    const criticalCounts = districts.map(
      (d) => localProblems.filter((p) => p.district === d && p.criticalityIndex >= 8.0).length
    );

    return {
      labels: ['Аль-Фараби', 'Каратау', 'Енбекши', 'Абай', 'Туран'],
      datasets: [
        {
          label: 'Всего жалоб',
          data: counts,
          backgroundColor: 'rgba(56, 189, 248, 0.7)',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: 'Критические (ЕКЦ 109)',
          data: criticalCounts,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#b91c1c',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [localProblems]);

  // Chart 2: Category Breakdown
  const categoryChartData = useMemo(() => {
    const categories: ProblemCategory[] = [
      ProblemCategory.ZHKH,
      ProblemCategory.ROADS,
      ProblemCategory.SAFETY,
      ProblemCategory.ECOLOGY,
      ProblemCategory.TRANSPORT,
      ProblemCategory.LANDSCAPING,
      ProblemCategory.ACCESSIBILITY,
    ];

    const counts = categories.map((c) => localProblems.filter((p) => p.category === c).length);

    return {
      labels: ['ЖКХ и тепло', 'Дороги', 'Безопасность', 'Экология', 'Транспорт', 'Благоустройство', 'Доступность'],
      datasets: [
        {
          data: counts,
          backgroundColor: [
            '#0ea5e9',
            '#f59e0b',
            '#ef4444',
            '#10b981',
            '#8b5cf6',
            '#ec4899',
            '#64748b',
          ],
          borderWidth: 2,
          borderColor: '#0f172a',
        },
      ],
    };
  }, [localProblems]);

  // Chart 3: Weekly Resolution Trend
  const trendLineData = useMemo(() => {
    return {
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      datasets: [
        {
          label: 'Новые жалобы от горожан',
          data: [12, 19, 24, 32, 28, 45, 52],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Устранено бригадами ЕКЦ 109',
          data: [8, 14, 18, 25, 27, 39, 48],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, []);

  const handleUpdateStatus = async (problemId: string, newStatus: ReportStatus) => {
    setIsUpdatingStatus(problemId);
    try {
      const res = await fetch(`/api/problems/${problemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Akimat Header */}
      <div className="bg-[#0b1120] rounded-2xl p-6 sm:p-8 border border-sky-900/40 text-slate-100 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.1)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Акимат г. Шымкент & ЕКЦ 109 &bull; Ситуационный мониторинг</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Дашборд диспетчеров и коммунальных служб
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl">
              Интеллектуальная агрегация голосов горожан («Шымкент Свайп»), фильтрация дубликатов 30м и прямая интеграция с аварийными бригадами ЕКЦ 109.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onSeedDemoData && (
              <button
                onClick={onSeedDemoData}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>+50 Демо-точек (Питч)</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-sky-500/30">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Шлюз ЕКЦ 109</div>
                <div className="text-xs font-bold text-emerald-400">Шымкент Online</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global City KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80 relative z-10">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Всего заявок</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono">{totalReportsCount}</div>
            <div className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>По 5 районам</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Критические (&gt;8.0)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-400 mt-1 font-mono">{criticalReportsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Передано в ЕКЦ 109</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Решено за неделю</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 font-mono">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1">С фотоотчетом</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Голосов горожан</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-300 mt-1 font-mono">{totalSwipes.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Свайп-верификация</div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Время реакции</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1 font-mono">1.8 ч</div>
            <div className="text-[11px] text-slate-400 mt-1">Норматив &lt; 4 часов</div>
          </div>
        </div>
      </div>

      {/* District Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedDistrict('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedDistrict === 'ALL'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          🏙️ Весь Шымкент ({localProblems.length})
        </button>
        {Object.entries(DISTRICT_LABELS).map(([key, data]) => {
          const count = localProblems.filter((p) => p.district === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedDistrict(key as District)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedDistrict === key
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {data.ru} ({count})
            </button>
          );
        })}
      </div>

      {/* Chart.js Analytics Grid (Prompt 7 Visualizations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Bar Chart of 5 Districts */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Распределение по 5 районам</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Шымкент</span>
          </div>
          <div className="h-64">
            <Bar
              data={districtChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Категории проблем</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Структура ЖКХ</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                },
                cutout: '62%',
              }}
            />
          </div>
        </div>

        {/* Chart 3: Weekly Dynamic Line */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Динамика устранения</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600">ЕКЦ 109 динамика</span>
          </div>
          <div className="h-64">
            <Line
              data={trendLineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map of Shymkent with Pins */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>Интерактивная карта критических инцидентов Шымкента</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Красные метки — критические (&gt;7.5), желтые — повышенный приоритет, зеленые — устраненные дефекты.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> &gt;8.0 Критично
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 5-8 Внимание
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Решено
            </span>
          </div>
        </div>

        <div ref={mapContainerRef} className="h-[400px] w-full relative z-0" />
      </div>

      {/* Dispatcher Incident Table with Live Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Реестр инцидентов и горячих обращений горожан
              </h2>
              <p className="text-xs text-slate-500">
                Всего отображается: {filteredProblems.length} заявок
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по адресу, названию, 109..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Фильтры:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">Все статусы</option>
              <option value="NEW">Новые</option>
              <option value="VERIFIED">Верифицированы</option>
              <option value="SENT_TO_109">Переданы в ЕКЦ 109</option>
              <option value="IN_PROGRESS">В работе бригады</option>
              <option value="RESOLVED">Устранены</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">Все категории</option>
              <option value="ZHKH">💧 ЖКХ и тепло</option>
              <option value="ROADS">🛣️ Дороги</option>
              <option value="SAFETY">🛡️ Безопасность</option>
              <option value="ECOLOGY">🌱 Экология</option>
              <option value="TRANSPORT">🚌 Транспорт</option>
              <option value="LANDSCAPING">🌳 Благоустройство</option>
              <option value="ACCESSIBILITY">♿ Доступная среда</option>
            </select>

            {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Инцидент / Адрес</th>
                <th className="py-3 px-4">Район / Категория</th>
                <th className="py-3 px-4 text-center">Свайпы / Критичность</th>
                <th className="py-3 px-4">ЕКЦ 109 Тикет</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4 text-right">Действия диспетчера</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredProblems.slice(0, 15).map((p) => {
                const catMeta = CATEGORY_METADATA[p.category] || CATEGORY_METADATA.SAFETY;
                const distMeta = DISTRICT_LABELS[p.district];

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.address}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Автор: {p.authorName}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{distMeta?.ru || p.district}</div>
                      <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        <span>{catMeta.icon}</span>
                        <span>{catMeta.labelRu}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-800">
                        <span className="text-emerald-600">+{p.swipeRightCount}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-400">-{p.swipeLeftCount}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.criticalityIndex >= 8.0
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : p.criticalityIndex >= 5.5
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          🔥 {p.criticalityIndex.toFixed(1)} / 10
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.ekc109TicketId ? (
                        <div>
                          <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {p.ekc109TicketId}
                          </span>
                          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Синхронизировано
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Ожидает порога 109</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={p.status}
                        disabled={isUpdatingStatus === p.id}
                        onChange={(e) => handleUpdateStatus(p.id, e.target.value as ReportStatus)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                          p.status === ReportStatus.RESOLVED
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : p.status === ReportStatus.IN_PROGRESS
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                            : p.status === ReportStatus.SENT_TO_109
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value="NEW">Новая</option>
                        <option value="VERIFIED">Верифицирована</option>
                        <option value="SENT_TO_109">Передано в ЕКЦ 109</option>
                        <option value="IN_PROGRESS">В работе бригады</option>
                        <option value="RESOLVED">Решено (Архив)</option>
                        <option value="REJECTED">Отклонено</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      {p.photoUrls && p.photoUrls.length > 0 && (
                        <button
                          onClick={() => setActivePhotoModal(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Фото</span>
                        </button>
                      )}
                      {p.status !== ReportStatus.RESOLVED && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, ReportStatus.RESOLVED)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Закрыть</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Inspection Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{activePhotoModal.title}</h3>
              <p className="text-xs text-slate-500">{activePhotoModal.address}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> До (Жалоба жителя)
                </div>
                <img
                  src={activePhotoModal.photoUrls[0]}
                  alt="До"
                  className="w-full h-44 object-cover rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> После (Отчет ЕКЦ 109)
                </div>
                {activePhotoModal.resolutionPhotoUrls && activePhotoModal.resolutionPhotoUrls.length > 0 ? (
                  <img
                    src={activePhotoModal.resolutionPhotoUrls[0]}
                    alt="После"
                    className="w-full h-44 object-cover rounded-xl border border-emerald-300"
                  />
                ) : (
                  <div className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center text-xs">
                    <span>Ремонтная бригада еще не загрузила акт</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActivePhotoModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
