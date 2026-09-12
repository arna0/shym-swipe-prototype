import React from 'react';
import { User, District, DISTRICT_LABELS } from '../types';
import {
  Database,
  Layers,
  Smartphone,
  BarChart3,
  Code2,
  Sparkles,
  Flame,
  PhoneCall,
  PlusCircle,
  Trophy,
  Cpu,
  Send,
} from 'lucide-react';

export type AppTab =
  | 'report-problem'
  | 'simulator'
  | 'ai_cluster'
  | 'akimat'
  | 'gamification'
  | 'tma'
  | 'feed-api'
  | 'swipe-api'
  | 'schema';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentUser: User;
  onDistrictChange?: (d: District) => void;
  onSeedDemoData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSeedDemoData,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-sky-900/30 text-[#e2e8f0] shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('simulator')}
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center font-black text-white text-base shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-white/20">
              Ш
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-extrabold tracking-tight text-white">
                Шымкент <span className="text-sky-400">Свайп 109</span>
              </span>
              <span className="hidden xl:inline-block px-2 py-0.5 bg-sky-500/10 border border-sky-400/20 rounded-md text-[10px] uppercase tracking-wider text-sky-300 font-mono">
                Smart City AI
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'simulator'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Лента свайпов</span>
            </button>

            <button
              onClick={() => setActiveTab('report-problem')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'report-problem'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Сообщить о дефекте</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">+50 XP</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_cluster')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'ai_cluster'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>ИИ (30м & NLP)</span>
            </button>

            <button
              onClick={() => setActiveTab('akimat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'akimat'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Акимат & 109</span>
            </button>

            <button
              onClick={() => setActiveTab('gamification')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'gamification'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Топ-10 Урбанистов</span>
            </button>

            <button
              onClick={() => setActiveTab('tma')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'tma'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-sky-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram TMA</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'schema'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Schema & API</span>
            </button>
          </nav>

          {/* User Gamification Stats Right */}
          <div className="flex items-center gap-3">
            {onSeedDemoData && (
              <button
                onClick={onSeedDemoData}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
                title="Загрузить 50+ реалистичных демо-точек"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>+50 Демо</span>
              </button>
            )}

            <div
              onClick={() => setActiveTab('gamification')}
              className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 p-1.5 px-3 rounded-xl border border-slate-800 cursor-pointer transition"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white tracking-wide font-mono">
                  {currentUser.xp.toLocaleString()} XP
                </span>
                <span className="text-[10px] text-sky-400 font-semibold">
                  Lvl {currentUser.level || 4} &bull; {DISTRICT_LABELS[currentUser.district]?.ru?.split(' ')[0] || 'Аль-Фараби'}
                </span>
              </div>
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full border border-sky-400/60 object-cover bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Mobile Scrolling Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 space-x-1.5 border-t border-slate-800/80 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'simulator' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
            }`}
          >
            📱 Свайп-лента
          </button>
          <button
            onClick={() => setActiveTab('report-problem')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'report-problem' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            + Подать жалобу (+50 XP)
          </button>
          <button
            onClick={() => setActiveTab('ai_cluster')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'ai_cluster' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
            }`}
          >
            🤖 ИИ 30м & NLP
          </button>
          <button
            onClick={() => setActiveTab('akimat')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'akimat' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
            }`}
          >
            📊 Акимат & 109
          </button>
          <button
            onClick={() => setActiveTab('gamification')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'gamification' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-300'
            }`}
          >
            🏆 Топ-10
          </button>
          <button
            onClick={() => setActiveTab('tma')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'tma' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-sky-300'
            }`}
          >
            ✈️ Telegram TMA
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg shrink-0 ${
              activeTab === 'schema' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
            }`}
          >
            🗄️ Schema & API
          </button>
        </div>
      </div>
    </header>
  );
};
