import React, { useState } from 'react';
import {
  Camera,
  UploadCloud,
  MapPin,
  LocateFixed,
  Flame,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Building2,
  Trash2,
  Plus,
  Send,
  FileCheck,
  Code2,
  Copy,
  Check,
  CheckCircle,
  HelpCircle,
  Radio,
  Share2,
  Layers,
  BarChart3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProblemCategory, District, CATEGORY_METADATA, DISTRICT_LABELS, ReportStatus } from '../types';
import { InteractiveMapPicker, SHYMKENT_LANDMARKS } from './InteractiveMapPicker';

interface ReportProblemScreenProps {
  onProblemCreated?: (newProblem: any) => void;
  onNavigateToFeed?: () => void;
  onNavigateToSimulator?: () => void;
  onNavigateToAkimat?: () => void;
}

// Preset photo examples of real city defects in Shymkent
const PRESET_PHOTOS = [
  {
    title: 'Яма на асфальте (пр. Тауке Хана)',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    category: ProblemCategory.ROADS,
  },
  {
    title: 'Порыв водопровода (ул. Капал Батыра)',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
    category: ProblemCategory.ZHKH,
  },
  {
    title: 'Стихийная свалка (р. Бадам)',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80',
    category: ProblemCategory.ECOLOGY,
  },
  {
    title: 'Открытый люк (мкр. Нурсат)',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    category: ProblemCategory.SAFETY,
  },
  {
    title: 'Сломанная площадка (ул. Рыскулова)',
    url: 'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80',
    category: ProblemCategory.LANDSCAPING,
  },
];

// Quick full scenarios for instant demo autofill
const DEMO_SCENARIOS = [
  {
    id: 'pipe',
    label: '💧 Порыв трубы (ЖКХ)',
    title: 'Порыв магистрального водопровода возле ТЦ Shymkent Plaza',
    description: 'Сильная утечка питьевой воды на проезжей части, затопление полосы движения. Угроза размыва дорожного полотна и провала грунта.',
    category: ProblemCategory.ZHKH,
    district: District.AL_FARABI,
    lat: 42.3195,
    lon: 69.5932,
    address: 'г. Шымкент, Аль-Фарабийский р-н, пр. Тәуке хан / пл. Аль-Фараби 3/1',
    photo: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'hole',
    label: '🕳️ Аварийная яма (Дороги)',
    title: 'Глубокая яма и провал асфальта на перекрестке пр. Тауке Хана',
    description: 'Опасный дефект дорожного покрытия глубиной более 15 см. Водители экстренно тормозят и выезжают на встречную полосу, создавая аварийные ситуации.',
    category: ProblemCategory.ROADS,
    district: District.AL_FARABI,
    lat: 42.3184,
    lon: 69.5975,
    address: 'г. Шымкент, Аль-Фарабийский р-н, пр. Тәуке хан 42',
    photo: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'manhole',
    label: '⚠️ Открытый колодец (Безопасность)',
    title: 'Открытый глубокий канализационный люк возле школы в мкр. Нурсат',
    description: 'Люк без чугунной крышки прямо на пешеходном тротуаре. В темное время суток дети и пожилые люди могут упасть в колодец глубиной 3 метра.',
    category: ProblemCategory.SAFETY,
    district: District.KARATAU,
    lat: 42.3705,
    lon: 69.6382,
    address: 'г. Шымкент, Каратауский р-н, мкр. Нурсат, ул. Шаяхметова 12',
    photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'trash',
    label: '🗑️ Стихийная свалка (Экология)',
    title: 'Стихийный сброс строительного мусора в водоохранной зоне р. Бадам',
    description: 'Самосвалы сгрузили горы бетона, пластика и бытовых отходов вдоль русла реки. Требуется расчистка спецтехникой и установка фотоловушки.',
    category: ProblemCategory.ECOLOGY,
    district: District.ENBEKSHI,
    lat: 42.2785,
    lon: 69.6012,
    address: 'г. Шымкент, Енбекшинский р-н, пойма реки Бадам, ул. Капал Батыра',
    photo: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80',
  },
];

// Quick notes templates for 109 dispatchers
const DISPATCHER_TEMPLATES = [
  'Аварийная ситуация на проезжей части. Высокий риск ДТП.',
  'Утечка питьевой воды под высоким давлением, размывает фундамент.',
  'Открытый глубокий колодец на пути детей к школе. Срочно закрыть!',
  'Стихийный сброс строительного мусора в водоохранной зоне.',
  'Отсутствует пандус и съезд для людей с инвалидностью.',
];

export const ReportProblemScreen: React.FC<ReportProblemScreenProps> = ({
  onProblemCreated,
  onNavigateToFeed,
  onNavigateToSimulator,
  onNavigateToAkimat,
}) => {
  const [activeTab, setActiveTab] = useState<'FORM' | 'API_SPEC'>('FORM');

  // Form states initialized with a ready-to-test problem
  const [title, setTitle] = useState(DEMO_SCENARIOS[0].title);
  const [description, setDescription] = useState(DEMO_SCENARIOS[0].description);
  const [category, setCategory] = useState<ProblemCategory>(DEMO_SCENARIOS[0].category);
  const [district, setDistrict] = useState<District>(DEMO_SCENARIOS[0].district);
  const [latitude, setLatitude] = useState<number>(DEMO_SCENARIOS[0].lat);
  const [longitude, setLongitude] = useState<number>(DEMO_SCENARIOS[0].lon);
  const [address, setAddress] = useState(DEMO_SCENARIOS[0].address);
  const [photoUrls, setPhotoUrls] = useState<string[]>([DEMO_SCENARIOS[0].photo]);

  // Submission & UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick autofill scenario handler
  const handleApplyScenario = (scenario: typeof DEMO_SCENARIOS[0]) => {
    setTitle(scenario.title);
    setDescription(scenario.description);
    setCategory(scenario.category);
    setDistrict(scenario.district);
    setLatitude(scenario.lat);
    setLongitude(scenario.lon);
    setAddress(scenario.address);
    setPhotoUrls([scenario.photo]);
    setErrorMsg(null);
  };

  // Determine district from coords helper
  const updateCoordsAndAddress = (lat: number, lon: number, districtHint?: District) => {
    setLatitude(lat);
    setLongitude(lon);
    if (districtHint) {
      setDistrict(districtHint);
    }
    // Update friendly address
    const landmark = SHYMKENT_LANDMARKS.find(
      (lm) => Math.abs(lm.lat - lat) < 0.001 && Math.abs(lm.lon - lon) < 0.001
    );
    if (landmark) {
      setAddress(`г. Шымкент, ${DISTRICT_LABELS[landmark.district].ru}, ${landmark.address}`);
      setDistrict(landmark.district);
    } else {
      setAddress(`г. Шымкент, ${DISTRICT_LABELS[districtHint || district].ru}, координаты ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  // Geolocation Handler
  const handleAutoGeolocation = () => {
    setIsLocating(true);
    setLocationSuccessMsg(null);
    setErrorMsg(null);

    if (!navigator.geolocation) {
      updateCoordsAndAddress(42.3195, 69.5932, District.AL_FARABI);
      setLocationSuccessMsg('GPS не поддерживается вашим браузером. Установлен центр Шымкента.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLon } = position.coords;
        const isNearShymkent = Math.abs(userLat - 42.32) < 0.8 && Math.abs(userLon - 69.6) < 0.8;
        const targetLat = isNearShymkent ? Number(userLat.toFixed(5)) : 42.3195;
        const targetLon = isNearShymkent ? Number(userLon.toFixed(5)) : 69.5932;

        updateCoordsAndAddress(targetLat, targetLon, isNearShymkent ? District.AL_FARABI : District.AL_FARABI);
        setLocationSuccessMsg(
          isNearShymkent
            ? `📍 Местоположение определено с точностью до 15м (${targetLat}, ${targetLon})`
            : `📍 Вы находитесь вне Шымкента — выставлена тестовая точка в центре Аль-Фараби (${targetLat}, ${targetLon})`
        );
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        updateCoordsAndAddress(42.3195, 69.5932, District.AL_FARABI);
        setLocationSuccessMsg('📍 Доступ к GPS ограничен. Установлены координаты центра Шымкента.');
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrls((prev) => [event.target!.result as string, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addPresetPhoto = (url: string, cat?: ProblemCategory) => {
    if (!photoUrls.includes(url)) {
      setPhotoUrls((prev) => [url, ...prev]);
    }
    if (cat) {
      setCategory(cat);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler -> POST /api/problems
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('Пожалуйста, введите заголовок проблемы (минимум 5 символов).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Пожалуйста, добавьте описание для диспетчера 109 (минимум 10 символов).');
      return;
    }

    if (photoUrls.length === 0) {
      setErrorMsg('Пожалуйста, добавьте хотя бы 1 фотографию дефекта для подтверждения инцидента.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        district,
        latitude,
        longitude,
        address: address.trim(),
        photoUrls,
        authorId: 'usr-shym-001',
        authorName: 'Батырхан Сейдалиев',
      };

      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setCreatedResult(data.data);
        if (onProblemCreated) {
          onProblemCreated(data.data.problem);
        }

        // Celebrate success
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'],
        });
      } else {
        setErrorMsg(data.message || 'Ошибка создания проблемы на сервере');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Сетевая ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setCreatedResult(null);
    setPhotoUrls([PRESET_PHOTOS[0].url]);
    setErrorMsg(null);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.08)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Camera className="w-3.5 h-3.5" />
              <span>React PWA Screen • Фотофиксация • Интерактивная карта Leaflet • POST /api/problems</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Подача городской проблемы в <span className="text-cyan-400">Шымкенте</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Мобильный экран для жителей 5 районов (Абай, Әл-Фараби, Еңбекші, Қаратау, Тұран). 
              Привязка геокоординат, фотофиксация дефекта, селектор категорий и мгновенное добавление в общую базу свайпов с начислением <strong>+50 XP</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('FORM')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'FORM'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Форма добавления (PWA)
            </button>
            <button
              onClick={() => setActiveTab('API_SPEC')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'API_SPEC'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Спецификация API (POST)
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Награда за отчет</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1 font-mono">+50 XP</div>
            <div className="text-[11px] text-gray-500">За публикацию инцидента</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>Геолокация</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">Leaflet & OSM</div>
            <div className="text-[11px] text-gray-500">Авто-определение района</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Фотофиксация</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">Camera / Gallery</div>
            <div className="text-[11px] text-gray-500">Пресеты дефектов Шымкента</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-red-400" />
              <span>Прямой шлюз</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">ЕКЦ 109 Open API</div>
            <div className="text-[11px] text-gray-500">Мгновенный посев в ленту</div>
          </div>
        </div>
      </div>

      {/* Main View */}
      {activeTab === 'FORM' ? (
        <div className="max-w-4xl mx-auto">
          {/* Success Modal / Banner when created */}
          {createdResult ? (
            <div className="bg-[#0e0e11] rounded-3xl p-8 border border-emerald-500/30 text-[#e0e0e2] shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  +50 XP НАЧИСЛЕНО
                </span>
                <h3 className="text-2xl font-bold text-white">Проблема успешно зарегистрирована!</h3>
                <p className="text-sm text-gray-400 max-w-lg mx-auto">
                  Карточка добавлена в общую базу свайпов и уже доступна для голосования жителям района{' '}
                  <strong className="text-cyan-400">{DISTRICT_LABELS[createdResult.problem.district]?.ru}</strong>.
                </p>
              </div>

              {/* Problem summary card */}
              <div className="bg-black/40 rounded-2xl p-5 border border-white/10 text-left max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    ID: #{createdResult.problem.id}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded font-medium border ${CATEGORY_METADATA[createdResult.problem.category as ProblemCategory]?.badgeBg}`}>
                    {CATEGORY_METADATA[createdResult.problem.category as ProblemCategory]?.labelRu}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white">{createdResult.problem.title}</h4>
                <p className="text-xs text-gray-400">{createdResult.problem.description}</p>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-2 border-t border-white/5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{createdResult.problem.address}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                {onNavigateToSimulator && (
                  <button
                    onClick={onNavigateToSimulator}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4" />
                    <span>📱 Перейти в ленту свайпов к новой карточке</span>
                  </button>
                )}
                {onNavigateToAkimat && (
                  <button
                    onClick={onNavigateToAkimat}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>📊 Открыть в дашборде Акимата</span>
                  </button>
                )}
                <button
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Подать еще одну заявку</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Form Layout (Mobile PWA Container) */
            <form onSubmit={handleSubmit} className="bg-[#0e0e11] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-8">
              {/* Quick 1-Click Demo Scenarios */}
              <div className="bg-cyan-950/40 p-4 rounded-2xl border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Быстрое заполнение демо-инцидентом в 1 клик:</span>
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">Выберите для теста</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEMO_SCENARIOS.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleApplyScenario(sc)}
                      className="p-2.5 rounded-xl bg-black/40 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-400/50 text-left text-xs font-medium text-gray-200 hover:text-white transition-all truncate"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* SECTION 1: Photo Upload / Camera */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Фотофиксация дефекта</span>
                        <span className="text-cyan-400 text-xs">*</span>
                      </h3>
                      <p className="text-[11px] text-gray-400">Сделайте снимок на камеру или загрузите файл с устройства</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-mono font-medium">
                    {photoUrls.length} фото добавлено
                  </span>
                </div>

                {/* Upload Action Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="relative border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-black/20 hover:bg-black/40 group">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 group-hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 transition-all mb-2 shadow-lg shadow-cyan-500/10">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-300">
                      Сделать снимок / Загрузить
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">PNG, JPG, HEIC до 15 МБ</span>
                  </label>

                  {/* Photo Preview Gallery */}
                  <div className="border border-white/10 rounded-2xl p-3 bg-black/30 flex items-center gap-2 overflow-x-auto">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 group">
                        <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                          title="Удалить фото"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {photoUrls.length === 0 && (
                      <div className="text-center w-full py-6 text-gray-500 text-xs">
                        Нет добавленных фотографий
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Presets of real defects */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Быстрые фото-пресеты (для демо):</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PRESET_PHOTOS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addPresetPhoto(item.url, item.category)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 text-left transition-all group"
                      >
                        <div className="w-full h-12 rounded-lg overflow-hidden mb-1">
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="text-[10px] text-gray-300 font-medium truncate">{item.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Category Selector */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Категория городской проблемы</span>
                      <span className="text-cyan-400 text-xs">*</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">Определяет маршрутизацию в профильное управление акимата</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.values(ProblemCategory).map((catKey) => {
                    const meta = CATEGORY_METADATA[catKey];
                    const isSelected = category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-white'
                            : 'bg-black/30 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl">{meta.icon}</span>
                          {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{meta.labelRu}</div>
                          <div className="text-[10px] text-gray-500 font-mono truncate">{meta.labelKz}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Geolocation & Map */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Геолокация и привязка к карте Шымкента</span>
                        <span className="text-cyan-400 text-xs">*</span>
                      </h3>
                      <p className="text-[11px] text-gray-400">Автоматическое определение по GPS или выбор точки на карте</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoGeolocation}
                    disabled={isLocating}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition-all shrink-0"
                  >
                    <LocateFixed className={`w-4 h-4 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Определение GPS...' : 'Определить мое местоположение'}</span>
                  </button>
                </div>

                {/* Status toast for geolocation */}
                {locationSuccessMsg && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{locationSuccessMsg}</span>
                  </div>
                )}

                {/* Leaflet Interactive Map */}
                <InteractiveMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onCoordinatesChange={updateCoordsAndAddress}
                  selectedDistrict={district}
                />

                {/* Address & District fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>Текстовый адрес / ориентир:</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="г. Шымкент, ул. / проспект..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Район Шымкента:</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value as District)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      {Object.values(District).map((d) => (
                        <option key={d} value={d}>
                          {DISTRICT_LABELS[d]?.ru} ({DISTRICT_LABELS[d]?.kz})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Problem Title & Dispatcher Description */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Описание проблемы для диспетчера ЕКЦ 109</span>
                      <span className="text-cyan-400 text-xs">*</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">Укажите суть дефекта и угрозу для безопасности или инфраструктуры</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium">Заголовок проблемы:</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например: Порыв магистрального водопровода возле ТЦ Shymkent Plaza"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-400 font-medium">Заметка для диспетчера 109:</label>
                      <span className="text-[10px] text-gray-500 font-mono">{description.length} симв.</span>
                    </div>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Подробно опишите масштаб проблемы, примерную глубину ямы, наличие запаха газа или опасность для пешеходов..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Dispatcher Templates */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Быстрые шаблоны заметок:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DISPATCHER_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDescription(tmpl)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-all text-left truncate max-w-full"
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA Bar */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Награда за публикацию:</span>
                      <span className="text-cyan-400 font-mono">+50 XP</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Карточка мгновенно появится в гео-ленте 5 районов
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Отправка в базу...' : 'Опубликовать проблему (+50 XP)'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* API Specification & Server Code Tab */
        <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>POST /api/problems • Endpoint Architecture & Schema</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Серверная спецификация добавления новых городских проблем
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-3xl">
              Эндпоинт принимает валидированные данные с мобильного клиента, производит геокодирование, начисляет пользователю 50 очков опыта (XP) и мгновенно регистрирует объект для включения в формулу выдачи <code className="text-cyan-300 font-mono">GET /api/feed</code>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Пример входящего JSON запроса:</span>
              <button
                onClick={() => handleCopyCode(SAMPLE_PROBLEM_PAYLOAD)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Скопировано' : 'Копировать JSON'}</span>
              </button>
            </div>
            <pre className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-gray-300 overflow-x-auto leading-relaxed">
              {SAMPLE_PROBLEM_PAYLOAD}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const SAMPLE_PROBLEM_PAYLOAD = `{
  "title": "Порыв магистрального водопровода возле ТЦ «Shymkent Plaza»",
  "description": "Сильная утечка питьевой воды на проезжей части, затопление полосы движения. Угроза размыва дорожного полотна.",
  "category": "ZHKH",
  "district": "AL_FARABI",
  "latitude": 42.3195,
  "longitude": 69.5932,
  "address": "г. Шымкент, Аль-Фарабийский р-н, пр. Тәуке хан / пл. Аль-Фараби 3/1",
  "photoUrls": [
    "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80"
  ],
  "authorId": "usr-shym-001",
  "authorName": "Батырхан Сейдалиев"
}`;
