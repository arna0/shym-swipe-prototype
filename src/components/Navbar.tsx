import React, { useEffect, useState } from 'react';
import { User, District, DISTRICT_LABELS } from '../types';
import { Database, Smartphone, BarChart3, Sparkles, PlusCircle, Trophy, Cpu, Send } from 'lucide-react';
import { getLang, onLangChange, setLang, type Lang } from '../i18n/translate';

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

const TABS: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'simulator', label: 'Свайп-лента', icon: Smartphone },
  { id: 'report-problem', label: '+ Сообщить о дефекте', icon: PlusCircle },
  { id: 'ai_cluster', label: 'ИИ 30м & NLP', icon: Cpu },
  { id: 'akimat', label: 'Акимат & 109', icon: BarChart3 },
  { id: 'gamification', label: 'Топ-10', icon: Trophy },
  { id: 'tma', label: 'Telegram TMA', icon: Send },
  { id: 'schema', label: 'Schema & API', icon: Database },
];

function LangSwitch() {
  const [lang, setLocal] = useState<Lang>(getLang());
  useEffect(() => { const off = onLangChange(setLocal); return () => { off(); }; }, []);
  return (
    <div className="flex items-center rounded-lg border border-slate-700/70 p-0.5 text-[11px] font-semibold" role="group" aria-label="Language">
      {(['ru', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md transition ${lang === l ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-white'}`}
        >
          {l === 'ru' ? 'RU' : 'EN'}
        </button>
      ))}
    </div>
  );
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, currentUser, onSeedDemoData }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0f1012]/95 backdrop-blur border-b border-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <button className="flex items-center gap-2.5 select-none" onClick={() => setActiveTab('simulator')}>
            <span className="w-8 h-8 bg-sky-500 rounded-lg grid place-items-center font-extrabold text-slate-950 text-sm">Ш</span>
            <span className="text-[17px] font-bold tracking-tight text-white">
              Шымкент <span className="text-sky-400">Свайп 109</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5 text-[13px] font-medium">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                  activeTab === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === id ? 'text-sky-400' : ''}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LangSwitch />
            {onSeedDemoData && (
              <button
                onClick={onSeedDemoData}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700/70 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-medium transition"
                title="Загрузить 50+ реалистичных демо-точек"
              >
                <Sparkles className="w-3 h-3" />
                <span>+50 Демо</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('gamification')}
              className="flex items-center gap-2.5 hover:bg-slate-800/60 py-1 px-2 rounded-lg transition"
            >
              <span className="flex flex-col items-end leading-tight">
                <span className="text-xs font-bold text-white tabular-nums">{currentUser.xp.toLocaleString()} XP</span>
                <span className="text-[10px] text-slate-400">
                  Lvl {currentUser.level || 4} · {DISTRICT_LABELS[currentUser.district]?.ru?.split(' ')[0] || 'Аль-Фараби'}
                </span>
              </span>
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.id}`}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full object-cover bg-slate-800"
              />
            </button>
          </div>
        </div>

        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800 text-xs font-medium scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 ${
                activeTab === id ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
