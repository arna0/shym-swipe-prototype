import React, { useState } from 'react';
import { PRISMA_QUERY_SNIPPETS } from '../data/schemaDocs';
import { Copy, Check, Code2, Sparkles, Terminal } from 'lucide-react';

export const CodeSnippets: React.FC = () => {
  const [activeSnippet, setActiveSnippet] = useState<'swipe' | 'spatial' | 'akimat'>('swipe');
  const [copied, setCopied] = useState(false);

  const snippets = {
    swipe: {
      title: '1. Транзакция свайпа ($transaction + XP + Formula)',
      desc: 'Атомарная фиксация голоса в PostgreSQL, пересчет индекса критичности и авто-эскалация в ЕКЦ 109.',
      code: PRISMA_QUERY_SNIPPETS.swipeTransaction,
    },
    spatial: {
      title: '2. Геопоиск в радиусе (PostGIS & Haversine)',
      desc: 'Выборка городских проблем рядом с пользователем по координатам OpenStreetMap.',
      code: PRISMA_QUERY_SNIPPETS.spatialRadiusQuery,
    },
    akimat: {
      title: '3. Агрегация для Акимата (DistrictAnalytics Upsert)',
      desc: 'Ежедневный сбор статистики по 5 районам Шымкента для руководства города.',
      code: PRISMA_QUERY_SNIPPETS.akimatAggregation,
    },
  };

  const current = snippets[activeSnippet];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-cyan-400" />
              <span>TypeScript Prisma Client API Snippets</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Готовые функции для backend-разработчиков хакатона Smart City Шымкент (Next.js App Router / Express / NestJS).
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>Скопировано в буфер!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                <span>Копировать TS код</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveSnippet('swipe')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSnippet === 'swipe'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Свайп-транзакция
          </button>

          <button
            onClick={() => setActiveSnippet('spatial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSnippet === 'spatial'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Геопоиск в радиусе
          </button>

          <button
            onClick={() => setActiveSnippet('akimat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSnippet === 'akimat'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Агрегация Акимата
          </button>
        </div>
      </div>

      {/* Code Display Frame */}
      <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="bg-[#0e0e11] px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-200 text-xs font-mono">{current.title}</span>
          </div>
          <span className="text-[11px] text-gray-400">{current.desc}</span>
        </div>

        <div className="p-4 sm:p-6 overflow-x-auto max-h-[600px] text-xs sm:text-sm font-mono text-gray-300">
          <pre className="selection:bg-cyan-500 selection:text-black">
            {current.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
