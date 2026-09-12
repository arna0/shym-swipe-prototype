import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  MousePointerClick, 
  BarChart, 
  Radio, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';

export const ERDiagram: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>('ProblemReport');

  const models = [
    {
      id: 'User',
      name: 'User (Пользователи)',
      icon: Users,
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      badge: 'Auth & Gamification',
      desc: 'Горожане, инспекторы и волонтеры с начислением XP, уровнем и привязкой к району Шымкента.',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Уникальный ключ пользователя' },
        { name: 'telegramId', type: 'BigInt (Unique)', desc: 'Telegram ID для ботов и Mini Apps' },
        { name: 'role', type: 'Enum Role', desc: 'CITIZEN | VOLUNTEER | INSPECTOR | ADMIN' },
        { name: 'district', type: 'Enum District', desc: 'Район проживания (Абай, Әл-Фараби...)' },
        { name: 'xp', type: 'Int', desc: 'Очки опыта (+10 за свайп, +50 за волонтерство)' },
        { name: 'level', type: 'Int', desc: 'Уровень геймификации' },
        { name: 'reputationScore', type: 'Float', desc: 'Коэффициент веса голоса' },
      ],
      relations: [
        { target: 'ProblemReport', type: '1 : N', label: 'Созданные репорты (authorId)' },
        { target: 'SwipeAction', type: '1 : N', label: 'Сделанные свайпы (userId)' },
        { target: 'VolunteerTask', type: '1 : N', label: 'Волонтерские задачи' },
      ],
    },
    {
      id: 'ProblemReport',
      name: 'ProblemReport (Заявки проблем)',
      icon: AlertTriangle,
      color: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
      badge: 'Core Entity + OSM Geo',
      desc: 'Городские дефекты с координатами OpenStreetMap, фотографиями, динамическим индексом критичности и привязкой к ЕКЦ 109.',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Уникальный идентификатор заявки' },
        { name: 'title / description', type: 'Text', desc: 'Описание городской проблемы' },
        { name: 'category', type: 'Enum ProblemCategory', desc: 'ЖКХ, Дороги, Экология, Безопасность...' },
        { name: 'district', type: 'Enum District', desc: 'Район города Шымкент' },
        { name: 'latitude, longitude', type: 'Decimal(10,7)', desc: 'Координаты OpenStreetMap (Гео-индекс)' },
        { name: 'address', type: 'VarChar(350)', desc: 'Адресная привязка' },
        { name: 'status', type: 'Enum ReportStatus', desc: 'NEW, SENT_TO_109, IN_PROGRESS, RESOLVED' },
        { name: 'criticalityIndex', type: 'Decimal(6,2)', desc: 'Автоматический расчет по формуле свайпов' },
        { name: 'ekc109TicketId', type: 'VarChar(64)', desc: 'Номер тикета в Smart Shymkent 109' },
      ],
      relations: [
        { target: 'User', type: 'N : 1', label: 'Автор заявки (authorId)' },
        { target: 'SwipeAction', type: '1 : N', label: 'Голоса граждан (Cascade delete)' },
        { target: 'EKC109SyncLog', type: '1 : N', label: 'Логи передачи в диспетчерскую 109' },
      ],
    },
    {
      id: 'SwipeAction',
      name: 'SwipeAction (Свайпы)',
      icon: MousePointerClick,
      color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      badge: 'Crowdsourcing Engine',
      desc: 'Фиксация свайпа каждого гражданина с защитой от накрутки и учетом веса голоса местного жителя.',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Идентификатор свайпа' },
        { name: 'userId, problemId', type: 'UUID (FK)', desc: '@@unique([userId, problemId])' },
        { name: 'swipeType', type: 'Enum SwipeType', desc: 'RIGHT_IMPORTANT | LEFT_IRRELEVANT | UP_VOLUNTEER' },
        { name: 'weight', type: 'Decimal(4,2)', desc: '1.5x для жителей этого же района' },
        { name: 'isLocalUser', type: 'Boolean', desc: 'Флаг локального резидентства' },
        { name: 'createdAt', type: 'DateTime', desc: 'Таймстамп фиксации' },
      ],
      relations: [
        { target: 'User', type: 'N : 1', label: 'Пользователь (FK: user_id)' },
        { target: 'ProblemReport', type: 'N : 1', label: 'Проблема (FK: problem_id)' },
      ],
    },
    {
      id: 'DistrictAnalytics',
      name: 'DistrictAnalytics (Дашборд Акимата)',
      icon: BarChart,
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      badge: 'Akimat Aggregations',
      desc: 'Суточный срез ключевых показателей по 5 районам Шымкента для руководства города.',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Идентификатор аналитической записи' },
        { name: 'district, date', type: 'Enum + Date', desc: '@@unique([district, date])' },
        { name: 'totalReports, newReports', type: 'Int', desc: 'Количество зафиксированных проблем' },
        { name: 'avgResolutionTimeHours', type: 'Decimal', desc: 'Скорость реагирования служб (часы)' },
        { name: 'avgCriticalityIndex', type: 'Decimal', desc: 'Средняя напряженность района' },
        { name: 'ekc109SyncRate', type: 'Decimal', desc: '% заявок, переданных в службу 109' },
      ],
      relations: [
        { target: 'District', type: 'Enum Ref', label: 'Привязка к 5 районам Шымкента' },
      ],
    },
    {
      id: 'EKC109SyncLog',
      name: 'EKC109SyncLog (Интеграция с ЕКЦ)',
      icon: Radio,
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
      badge: 'Smart Shymkent 109',
      desc: 'Двусторонняя синхронизация с диспетчерской службой акимата (Open API ЕКЦ 109).',
      fields: [
        { name: 'id', type: 'UUID (PK)', desc: 'Идентификатор лога' },
        { name: 'problemId', type: 'UUID (FK)', desc: 'Связь с ProblemReport' },
        { name: 'requestBody / response', type: 'JSONB', desc: 'Слепок полезной нагрузки REST API' },
        { name: 'httpStatus, isSuccess', type: 'Int, Boolean', desc: 'Статус доставки в ЕКЦ' },
      ],
      relations: [
        { target: 'ProblemReport', type: 'N : 1', label: 'Привязанная городская проблема' },
      ],
    },
  ];

  const current = models.find((m) => m.id === selectedModel) || models[1];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-[#0e0e11] rounded-2xl p-6 sm:p-8 border border-white/10 text-[#e0e0e2] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Реляционная архитектура & <span className="text-cyan-400">ER-Диаграмма связей</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Взаимосвязь моделей PostgreSQL, каскадное удаление (ON DELETE CASCADE) и уникальные составные ограничения.
            </p>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => {
          const Icon = model.icon;
          const isSelected = selectedModel === model.id;

          return (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                isSelected
                  ? 'bg-[#1a1a1e] border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30'
                  : 'bg-[#0e0e11]/80 border-white/10 hover:border-white/20 hover:bg-[#1a1a1e]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${model.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{model.name.split(' ')[0]}</h3>
                    <span className="text-[10px] text-gray-400">{model.name.split('(')[1]?.replace(')', '')}</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10 font-mono">
                  {model.badge}
                </span>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                {model.desc}
              </p>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 font-mono">
                <span>{model.fields.length} полей</span>
                <span className="flex items-center gap-1 text-cyan-400 font-medium">
                  Свойства <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Inspection Panel */}
      <div className="bg-[#0e0e11]/90 rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${current.color}`}>
              <current.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{current.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                  model {current.id}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{current.desc}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fields Table */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Поля и типы данных PostgreSQL
            </h4>
            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-gray-400 font-semibold border-b border-white/10 font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Имя поля</th>
                    <th className="py-2.5 px-4">Тип Prisma / DB</th>
                    <th className="py-2.5 px-4">Назначение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {current.fields.map((field, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-cyan-300">{field.name}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400 text-[11px]">{field.type}</td>
                      <td className="py-2.5 px-4 text-gray-400 text-[11px]">{field.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relations & Foreign Keys */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Внешние ключи (Relations)
            </h4>
            <div className="space-y-2">
              {current.relations.map((rel, idx) => (
                <div key={idx} className="bg-black/40 p-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                    <span className="font-mono text-cyan-300">{rel.target}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                      {rel.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{rel.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
