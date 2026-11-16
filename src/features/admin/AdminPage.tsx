import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  Flame,
  MessageSquare,
  Search,
  Settings2,
  Shield,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { useI18n } from '@/lib/i18n';
import {
  ActivityCalendarModal,
  type DailyCalendarEntry,
} from '@/components/admin/ActivityCalendarModal';
import { AdminSupportCenter } from '@/components/admin/AdminSupportCenter';
import {
  AdminAICostsPanel,
  type AIUsageSummary,
} from '@/components/admin/AdminAICostsPanel';

interface StudentDifficulty {
  competency_id: string;
  title: string;
  skill_domain: string;
  cefr_level: string;
  lesson_title: string | null;
  avg_score: number;
  mastery_score: number;
  attempts: number;
  errors: number;
}

interface AdminStudent {
  id: string;
  full_name: string;
  email: string;
  role: string;
  native_language: string;
  onboarding_completed: boolean;
  created_at: string;
  course_id: string | null;
  target_language: string;
  course_title: string;
  target_cefr_level: string;
  focus_area: string;
  daily_minutes_goal: number;
  total_attempts: number;
  active_days: number;
  estimated_minutes: number;
  avg_score: number;
  mastered_count: number;
  pending_reviews: number;
  overdue_reviews: number;
  last_activity_at: string | null;
  engagement_status: 'em_dia' | 'atencao' | 'inativo';
  current_lesson: {
    id: string;
    title: string;
    unit_title: string;
    cefr_level: string;
  } | null;
  difficulty_level: 'baixa' | 'moderada' | 'alta';
  difficulties: StudentDifficulty[];
  daily_calendar: DailyCalendarEntry[];
  streak_days: number;
  frequency_pct: number;
  dedication_label: 'Alta dedicação' | 'Regular' | 'Irregular' | 'Iniciando';
  open_support_tickets: number;
  unread_support_messages: number;
}

interface AdminOverviewResponse {
  summary: {
    total_students: number;
    active_last_7d: number;
    attention_needed: number;
    avg_score: number;
    unread_support_total?: number;
  };
  students: AdminStudent[];
  ai_usage?: AIUsageSummary;
}

function buildLastNDaysStrip(n: number, entries: DailyCalendarEntry[]) {
  const map = new Map(entries.map((e) => [e.date, e]));
  const result: Array<{ date: string; entry: DailyCalendarEntry | null }> = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const iso = cursor.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    result.push({ date: iso, entry: map.get(iso) ?? null });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function AdminPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'students' | 'support' | 'ai_costs' | 'billing' | 'school'>('students');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'em_dia' | 'atencao' | 'inativo'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [calendarStudentId, setCalendarStudentId] = useState<string | null>(null);
  const [supportStudentFilter, setSupportStudentFilter] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    enabled: profile?.role === 'admin',
    queryFn: async () => {
      const { data: res, error: fnError } = await supabase.functions.invoke('admin-overview');
      if (fnError) throw new Error(fnError.message);
      return res as AdminOverviewResponse;
    },
  });

  if (profile?.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-300 flex items-center gap-3">
        <Shield className="h-5 w-5 shrink-0" />
        <span>Acesso restrito a administradores da escola JVX SPEAK.</span>
      </div>
    );
  }

  const allStudents = data?.students ?? [];
  const selectedStudent = allStudents.find((s) => s.id === selectedStudentId) ?? null;
  const calendarStudent = allStudents.find((s) => s.id === calendarStudentId) ?? null;

  const students = allStudents.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'all' || s.engagement_status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status: AdminStudent['engagement_status']) => {
    if (status === 'em_dia') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Em dia
        </span>
      );
    }
    if (status === 'atencao') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Cobrar revisão
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
        <Clock className="h-3 w-3" /> Inativo
      </span>
    );
  };

  const difficultyBadge = (level: AdminStudent['difficulty_level']) => {
    if (level === 'alta') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
          Alta dificuldade
        </span>
      );
    }
    if (level === 'moderada') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
          Moderada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
        Fluindo bem
      </span>
    );
  };

  const unreadSupportTotal = data?.summary.unread_support_total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3B] dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#D4AF37]" />
            {t('admin_title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('admin_subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl border border-[#1F4E79] px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition self-start"
        >
          Atualizar KPIs
        </button>
      </div>

      {/* Tabs SaaS */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'students' as const, label: t('admin_tab_students'), icon: Users, badge: 0 },
          {
            id: 'support' as const,
            label: 'Atendimento & Chat',
            icon: MessageSquare,
            badge: unreadSupportTotal,
          },
          { id: 'ai_costs' as const, label: 'Consumo & Custos IA', icon: Cpu, badge: 0 },
          { id: 'billing' as const, label: t('admin_tab_billing'), icon: CreditCard, badge: 0 },
          { id: 'school' as const, label: t('admin_tab_school'), icon: Settings2, badge: 0 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                if (item.id !== 'support') setSupportStudentFilter(null);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                tab === item.id
                  ? 'bg-[#D4AF37] text-[#0B1F3B]'
                  : 'border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'students' && (
        <>
          {/* KPIs Gerais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
              <p className="text-xs text-slate-400">Alunos Matriculados</p>
              <p className="text-2xl font-bold mt-1">{data?.summary.total_students ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
              <p className="text-xs text-slate-400">Ativos (7 dias)</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {data?.summary.active_last_7d ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
              <p className="text-xs text-slate-400">Precisam de Cobrança</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {data?.summary.attention_needed ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
              <p className="text-xs text-slate-400">Média Geral da Escola</p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                {data?.summary.avg_score ?? 0}%
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar aluno por nome ou e-mail..."
                className="w-full rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-white dark:bg-[#0B1F3B] pl-10 pr-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-white dark:bg-[#0B1F3B] px-3.5 py-2.5 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="em_dia">Em dia</option>
              <option value="atencao">Cobrar revisão</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Carregando indicadores...</p>}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
              {(error as Error).message}
            </div>
          )}

          {/* Tabela / Lista de Alunos */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] text-slate-500 dark:text-slate-300 uppercase">
                  <tr>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Curso & Lição Atual</th>
                    <th className="px-4 py-3">Frequência / Tempo</th>
                    <th className="px-4 py-3">Desempenho & Dificuldade</th>
                    <th className="px-4 py-3">SRS / Chat</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
                  {students.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudentId(st.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-[#1F4E79]/20 cursor-pointer transition ${
                        selectedStudentId === st.id ? 'bg-[#D4AF37]/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{st.full_name}</p>
                        <p className="text-[11px] text-slate-400">{st.email || st.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>
                          <span className="font-semibold text-[#D4AF37]">{st.native_language}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span>{st.target_language === 'es-ES' ? 'Espanhol' : 'Inglês'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {st.current_lesson
                            ? `${st.current_lesson.cefr_level} • ${st.current_lesson.title}`
                            : 'Nenhuma lição iniciada'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-semibold">
                              {st.active_days} dia(s) • {st.frequency_pct}% freq.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              ~{st.estimated_minutes} min ({st.dedication_label})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalendarStudentId(st.id);
                            }}
                            className="rounded-lg border border-[#1F4E79]/50 p-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
                            title="Abrir calendário de frequência"
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <p className="font-semibold">
                          {st.avg_score}% média • {st.mastered_count} dominadas
                        </p>
                        {difficultyBadge(st.difficulty_level)}
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <span
                          className={`font-bold block ${
                            st.overdue_reviews > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {st.overdue_reviews} SRS atrasadas
                        </span>
                        {st.unread_support_messages > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            <MessageSquare className="h-3 w-3" />
                            {st.unread_support_messages} dúvida(s)
                          </span>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            {st.open_support_tickets} chamado(s)
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusBadge(st.engagement_status)}</td>
                    </tr>
                  ))}
                  {!isLoading && students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Nenhum aluno encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalhe Rico de Acompanhamento */}
          {selectedStudent && (
            <div className="rounded-3xl border border-[#D4AF37]/40 bg-[#0B1F3B] text-white p-6 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">
                    Detalhe de Acompanhamento Pedagógico
                  </span>
                  <h3 className="text-xl font-bold mt-0.5">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-slate-300">
                    {selectedStudent.email} • Foco: {selectedStudent.focus_area} • Meta CEFR:{' '}
                    {selectedStudent.target_cefr_level} • Meta diária:{' '}
                    {selectedStudent.daily_minutes_goal} min/dia
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalendarStudentId(selectedStudent.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B1F3B] transition"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Abrir Calendário Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSupportStudentFilter(selectedStudent.id);
                      setTab('support');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#0B1F3B] hover:brightness-105 transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat / Dúvidas
                    {selectedStudent.unread_support_messages > 0 && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">
                        {selectedStudent.unread_support_messages}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(null)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* KPIs do Aluno */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="rounded-2xl bg-[#06152B] p-3.5 border border-[#1F4E79]/40">
                  <p className="text-slate-400 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" /> Lição Atual
                  </p>
                  <p className="text-sm font-bold mt-1 truncate">
                    {selectedStudent.current_lesson?.title ?? 'Não iniciada'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedStudent.current_lesson
                      ? `${selectedStudent.current_lesson.cefr_level} • ${selectedStudent.current_lesson.unit_title}`
                      : selectedStudent.course_title}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#06152B] p-3.5 border border-[#1F4E79]/40">
                  <p className="text-slate-400 flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-emerald-400" /> Dedicação (30d)
                  </p>
                  <p className="text-sm font-bold mt-1 text-emerald-400">
                    {selectedStudent.dedication_label}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudent.frequency_pct}% frequência • {selectedStudent.active_days} dia(s)
                  </p>
                </div>

                <div className="rounded-2xl bg-[#06152B] p-3.5 border border-[#1F4E79]/40">
                  <p className="text-slate-400 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400" /> Sequência & Tempo
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {selectedStudent.streak_days} dia(s) seguidos
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudent.estimated_minutes} min totais
                  </p>
                </div>

                <div className="rounded-2xl bg-[#06152B] p-3.5 border border-[#1F4E79]/40">
                  <p className="text-slate-400">Tentativas & Nota</p>
                  <p className="text-sm font-bold mt-1">
                    {selectedStudent.total_attempts} tent. ({selectedStudent.avg_score}%)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedStudent.mastered_count} competência(s) dominadas
                  </p>
                </div>

                <div className="rounded-2xl bg-[#06152B] p-3.5 border border-[#1F4E79]/40">
                  <p className="text-slate-400">Última Atividade</p>
                  <p className="text-sm font-bold mt-1">
                    {selectedStudent.last_activity_at
                      ? new Date(selectedStudent.last_activity_at).toLocaleDateString('pt-BR')
                      : 'Sem atividade'}
                  </p>
                  <p className="text-[11px] text-amber-400">
                    {selectedStudent.overdue_reviews} SRS atrasadas
                  </p>
                </div>
              </div>

              {/* Galeria Alinhada de Frequência (últimos 21 dias) + Dificuldades */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Galeria Alinhada Clicável */}
                <div className="lg:col-span-6 rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#D4AF37]">
                        Galeria de Frequência (Últimos 21 dias)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Clique em qualquer dia para abrir o calendário detalhado
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarStudentId(selectedStudent.id)}
                      className="text-[11px] font-semibold text-[#D4AF37] hover:underline"
                    >
                      Ver mês inteiro →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {buildLastNDaysStrip(21, selectedStudent.daily_calendar).map(
                      ({ date, entry }) => {
                        const dayNum = date.slice(8, 10);
                        const hitGoal =
                          entry && entry.minutes >= selectedStudent.daily_minutes_goal;
                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setCalendarStudentId(selectedStudent.id)}
                            title={
                              entry
                                ? `${date}: ${entry.minutes} min (${entry.sessions} acesso(s))`
                                : `${date}: Sem acesso`
                            }
                            className={`h-11 rounded-xl border flex flex-col items-center justify-center transition ${
                              entry
                                ? hitGoal
                                  ? 'bg-emerald-500/25 border-emerald-400/60 text-white hover:scale-105'
                                  : 'bg-[#D4AF37]/25 border-[#D4AF37]/60 text-white hover:scale-105'
                                : 'bg-[#0B1F3B] border-[#1F4E79]/30 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            <span className="text-[11px] font-bold">{dayNum}</span>
                            <span className="text-[9px] text-slate-300">
                              {entry ? `${entry.minutes}m` : '—'}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Pontos de Dificuldade */}
                <div className="lg:col-span-6 rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-rose-400" />
                      Pontos de Dificuldade do Aluno
                    </p>
                    {difficultyBadge(selectedStudent.difficulty_level)}
                  </div>

                  {selectedStudent.difficulties.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">
                      Nenhuma dificuldade crítica registrada até o momento.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedStudent.difficulties.map((d) => (
                        <div key={d.competency_id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-semibold truncate">
                              {d.lesson_title ? `${d.lesson_title} — ` : ''}
                              {d.title}
                            </span>
                            <span className="text-[11px] text-rose-400 font-bold shrink-0">
                              {d.avg_score}% ({d.errors} erro(s))
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#0B1F3B] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                d.avg_score < 60
                                  ? 'bg-rose-500'
                                  : d.avg_score < 80
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.max(8, d.avg_score)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'support' && (
        <AdminSupportCenter
          students={allStudents.map((s) => ({
            id: s.id,
            full_name: s.full_name,
            email: s.email,
            course_title: s.course_title,
          }))}
          initialStudentFilter={supportStudentFilter}
          onRefreshOverview={() => refetch()}
        />
      )}

      {tab === 'ai_costs' && (
        <AdminAICostsPanel
          aiUsage={data?.ai_usage}
          activeStudentsCount={data?.summary.total_students ?? 0}
        />
      )}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Plano Starter',
              price: 'R$ 79/mês',
              desc: 'A1-A2 + Agenda SRS + Prática IA limitada',
            },
            {
              name: 'Plano Pro IA',
              price: 'R$ 149/mês',
              desc: 'CEFR Completo + Fala Ilimitada + Voz Neural',
            },
            {
              name: 'Corporativo B2B',
              price: 'Sob consulta',
              desc: 'Gestão de equipes, KPIs e relatórios por empresa',
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-5 space-y-2"
            >
              <span className="text-xs font-bold uppercase text-[#D4AF37]">Estrutura SaaS</span>
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="text-2xl font-bold text-[#D4AF37]">{plan.price}</p>
              <p className="text-xs text-slate-500 dark:text-slate-300">{plan.desc}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'school' && (
        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-base font-bold">Configuração Pedagógica & Idiomas da Escola</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-[#06152B] p-4 border border-slate-200 dark:border-[#1F4E79]/40">
              <p className="font-bold text-[#D4AF37] mb-1">Cursos Ativos</p>
              <p>Inglês Estruturado CEFR (A1–C2) • Espanhol Peninsular (Instituto Cervantes)</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-[#06152B] p-4 border border-slate-200 dark:border-[#1F4E79]/40">
              <p className="font-bold text-[#D4AF37] mb-1">
                Idiomas Nativos Suportados (Dicas & i18n)
              </p>
              <p>Português (Brasil) • Español • English</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calendário Completo */}
      {calendarStudent && (
        <ActivityCalendarModal
          studentName={calendarStudent.full_name}
          dailyGoalMinutes={calendarStudent.daily_minutes_goal}
          activeDays={calendarStudent.active_days}
          totalMinutes={calendarStudent.estimated_minutes}
          streakDays={calendarStudent.streak_days}
          frequencyPct={calendarStudent.frequency_pct}
          dedicationLabel={calendarStudent.dedication_label}
          entries={calendarStudent.daily_calendar}
          onClose={() => setCalendarStudentId(null)}
        />
      )}
    </div>
  );
}
