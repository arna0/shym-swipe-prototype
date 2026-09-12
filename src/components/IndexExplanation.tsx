import React from 'react';
import { 
  Sparkles, 
  MapPin, 
  Flame, 
  Layers, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Database,
  ArrowRight
} from 'lucide-react';

export const IndexExplanation: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Индексы & Геопространственная оптимизация <span className="text-cyan-400">(Smart City Scale)</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Архитектурный разбор индексов схемы Prisma для миллионов свайпов и радиусного геопоиска по Шымкенту.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Indexes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Spatial & Geo Index */}
        <div className="bg-[#0e0e11]/90 rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-white">1. Гео-индекс координат (OSM)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              O(log N)
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs text-cyan-300">
            @@index([latitude, longitude], name: "idx_reports_geo_coords")
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Составной B-Tree индекс по широте и долготе позволяет приложению мгновенно находить проблемы 
            в радиусе 1–3 км вокруг текущей геопозиции смартфона гражданина через формулу гаверсинусов (Haversine Bounding Box).
          </p>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-[11px] text-gray-300 space-y-1.5">
            <div className="font-semibold text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Преимущество для мобильного клиента:</span>
            </div>
            <p className="text-gray-400">
              Свайп-лента в первую очередь показывает проблемы на соседних улицах (пр. Тауке Хана, ул. Байтурсынова, мкр. Нурсат).
            </p>
          </div>
        </div>

        {/* 2. Criticality Swipe Feed Index */}
        <div className="bg-[#0e0e11]/90 rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-white">2. Индекс Свайп-Ленты & Критичности</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
              B-Tree Composite
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs text-cyan-300">
            @@index([status, criticalityIndex(sort: Desc)])
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Покрывающий индекс для главного запроса выдачи карточек в Tinder-интерфейс: 
            фильтрует статус <code className="text-cyan-300 font-mono">NEW</code> и мгновенно сортирует по убыванию индекса критичности.
          </p>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-[11px] text-gray-300 space-y-1.5">
            <div className="font-semibold text-orange-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero-Sort Overhead:</span>
            </div>
            <p className="text-gray-400">
              База PostgreSQL считывает данные прямо из дерева индекса без операции дорогостоящей сортировки в оперативной памяти (Index Scan).
            </p>
          </div>
        </div>

        {/* 3. Unique Swipe Constraint */}
        <div className="bg-[#0e0e11]/90 rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-white">3. Защита от накрутки (Anti-Fraud)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Unique Constraint
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs text-cyan-300">
            @@unique([userId, problemId], name: "unique_user_problem_swipe")
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            На уровне ядра базы данных накладывается строгое уникальное ограничение. 
            Один пользователь не может отправить повторный свайп по той же проблеме, исключая спам-атаки ботов.
          </p>
        </div>

        {/* 4. Akimat Aggregation Index */}
        <div className="bg-[#0e0e11]/90 rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-white">4. Индекс Районного Дашборда</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              District Analytics
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 font-mono text-xs text-cyan-300">
            @@index([district, status], name: "idx_reports_district_status")
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Обеспечивает мгновенный отклик дашборда районного акима (например, выборка всех заявок со статусом IN_PROGRESS по Аль-Фарабийскому району).
          </p>
        </div>

      </div>
    </div>
  );
};
