import { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Target,
  BookOpen,
  X,
} from 'lucide-react';

export interface DailyCalendarEntry {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
  lesson_title: string | null;
}

interface ActivityCalendarModalProps {
  studentName: string;
  dailyGoalMinutes: number;
  activeDays: number;
  totalMinutes: number;
  streakDays: number;
  frequencyPct: number;
  dedicationLabel: string;
  entries: DailyCalendarEntry[];
  onClose: () => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityCalendarModal({
  studentName,
  dailyGoalMinutes,
  activeDays,
  totalMinutes,
  streakDays,
  frequencyPct,
  dedicationLabel,
  entries,
  onClose,
}: ActivityCalendarModalProps) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(
    () => entries[0]?.date ?? new Date().toLocaleDateString('en-CA')
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, DailyCalendarEntry>();
    for (const e of entries) {
      map.set(e.date, e);
    }
    return map;
  }, [entries]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, iso: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, iso: `${viewYear}-${mm}-${dd}` });
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedEntry = selectedDate ? entryMap.get(selectedDate) ?? null : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-[#D4AF37]/40 bg-[#0B1F3B] text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#1F4E79]/50 bg-[#06152B] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                Calendário de Frequência & Dedicação
              </p>
              <h3 className="text-lg font-bold">{studentName}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Fechar calendário"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400 flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5 text-[#D4AF37]" /> Dias Ativos
              </p>
              <p className="text-lg font-bold mt-1">{activeDays} dias</p>
            </div>
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-400" /> Tempo Total
              </p>
              <p className="text-lg font-bold mt-1">{totalMinutes} min</p>
            </div>
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> Sequência
              </p>
              <p className="text-lg font-bold mt-1">{streakDays} dia(s)</p>
            </div>
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-emerald-400" /> Dedicação (30d)
              </p>
              <p className="text-sm font-bold mt-1 text-emerald-400">
                {dedicationLabel} ({frequencyPct}%)
              </p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-xl border border-[#1F4E79]/60 p-2 hover:bg-[#1F4E79]/30 transition"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-sm font-bold capitalize text-[#D4AF37]">{monthLabel}</h4>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-xl border border-[#1F4E79]/60 p-2 hover:bg-[#1F4E79]/30 transition"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-400">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, idx) => {
                if (!cell.day || !cell.iso) {
                  return <div key={`empty-${idx}`} className="h-12 rounded-xl bg-transparent" />;
                }
                const entry = entryMap.get(cell.iso);
                const isSelected = selectedDate === cell.iso;
                const hitGoal = entry ? entry.minutes >= dailyGoalMinutes : false;

                let bgClass =
                  'bg-[#06152B] border-[#1F4E79]/30 text-slate-400 hover:border-slate-500';
                if (entry) {
                  bgClass = hitGoal
                    ? 'bg-emerald-500/25 border-emerald-400/60 text-white hover:bg-emerald-500/35'
                    : 'bg-[#D4AF37]/25 border-[#D4AF37]/60 text-white hover:bg-[#D4AF37]/35';
                }

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedDate(cell.iso)}
                    className={`h-12 rounded-xl border flex flex-col items-center justify-center transition relative ${bgClass} ${
                      isSelected ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    <span className="text-xs font-bold">{cell.day}</span>
                    {entry && (
                      <span className="text-[9px] font-semibold text-[#D4AF37]">
                        {entry.minutes}m
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="rounded-2xl border border-[#1F4E79]/50 bg-[#06152B] p-4">
            {selectedDate && selectedEntry ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#D4AF37]">
                    {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                    Lição: {selectedEntry.lesson_title || 'Navegação / Revisão geral'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="rounded-xl bg-[#0B1F3B] px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">Tempo</p>
                    <p className="font-bold text-white">{selectedEntry.minutes} min</p>
                  </div>
                  <div className="rounded-xl bg-[#0B1F3B] px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">Acessos</p>
                    <p className="font-bold text-white">{selectedEntry.sessions}x</p>
                  </div>
                  <div className="rounded-xl bg-[#0B1F3B] px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-400">Meta ({dailyGoalMinutes}m)</p>
                    <p
                      className={`font-bold ${
                        selectedEntry.minutes >= dailyGoalMinutes
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {selectedEntry.minutes >= dailyGoalMinutes ? 'Cumprida' : 'Parcial'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {selectedDate
                  ? `Nenhum acesso registrado em ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')}.`
                  : 'Clique em um dia do calendário para ver os detalhes.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
