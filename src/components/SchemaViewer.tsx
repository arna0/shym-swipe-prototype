import React, { useState } from 'react';
import { PRISMA_SCHEMA_CODE } from '../data/schemaDocs';
import { 
  Copy, 
  Check, 
  Download, 
  Search, 
  FileCode, 
  Layers, 
  CheckCircle2,
  Cpu,
  KeyRound,
  Compass
} from 'lucide-react';

export const SchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(PRISMA_SCHEMA_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PRISMA_SCHEMA_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema.prisma';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.07)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Production-Ready Prisma Schema • PostgreSQL 16+</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              schema.prisma для <span className="text-cyan-400">«Шымкент Свайп»</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Реляционная схема базы данных с поддержкой сверхбыстрого геопоиска по координатам (OpenStreetMap), 
              автоматическим расчетом индекса критичности, интеграцией с ЕКЦ 109 и агрегированной аналитикой по 5 районам Шымкента.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Копировать .prisma</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Скачать файл</span>
            </button>
          </div>
        </div>

        {/* Quick Spec Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Моделей данных</span>
            </div>
            <div className="text-xl font-semibold text-white mt-1">8 моделей</div>
            <div className="text-[11px] text-gray-500">User, Problem, Swipe, Analytics...</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Районы Шымкента</span>
            </div>
            <div className="text-xl font-semibold text-white mt-1">5 районов</div>
            <div className="text-[11px] text-gray-500">Абай, Әл-Фараби, Еңбекші, Қаратау, Тұран</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              <span>Гео-индексация</span>
            </div>
            <div className="text-xl font-semibold text-white mt-1">B-Tree & PostGIS</div>
            <div className="text-[11px] text-gray-500">idx_reports_geo_coords O(log N)</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
              <span>Ограничения & ЕКЦ</span>
            </div>
            <div className="text-xl font-semibold text-white mt-1">109 Sync + Unique</div>
            <div className="text-[11px] text-gray-500">@@unique([userId, problemId])</div>
          </div>
        </div>
      </div>

      {/* Code Editor Frame */}
      <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-[#0e0e11] px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-gray-400 text-xs font-mono ml-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              prisma/schema.prisma
            </span>
          </div>

          {/* Search in schema */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по моделям и полям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 text-gray-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-white/10 focus:outline-none focus:border-cyan-400 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[700px] text-xs sm:text-sm font-mono leading-relaxed text-gray-300">
          <pre className="selection:bg-cyan-500 selection:text-black">
            {PRISMA_SCHEMA_CODE.split('\n').map((line, idx) => {
              const isComment = line.trim().startsWith('//') || line.trim().startsWith('///');
              const isModel = line.trim().startsWith('model ') || line.trim().startsWith('enum ');
              const isField = line.trim().startsWith('@@') || line.trim().startsWith('@id');
              const isHighlighted = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={idx}
                  className={`table-row ${isHighlighted ? 'bg-cyan-500/20 text-cyan-200 font-semibold' : ''}`}
                >
                  <span className="table-cell text-right pr-4 select-none text-gray-600 text-[11px] w-10">
                    {idx + 1}
                  </span>
                  <span
                    className={`table-cell whitespace-pre ${
                      isComment
                        ? 'text-gray-500 italic'
                        : isModel
                        ? 'text-cyan-300 font-bold'
                        : isField
                        ? 'text-orange-400'
                        : line.includes('String') || line.includes('Int') || line.includes('Decimal') || line.includes('DateTime') || line.includes('BigInt')
                        ? 'text-emerald-400'
                        : 'text-gray-200'
                    }`}
                  >
                    {line}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};
