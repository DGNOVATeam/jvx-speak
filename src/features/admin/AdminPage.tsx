import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  Settings2,
  Shield,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { useI18n } from '@/lib/i18n';

interface AdminStudent {
  id: string;
  full_name: string;
  email: string;
  role: string;
  native_language: string;
  onboarding_completed: boolean;
  created_at: string;
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
}

interface AdminOverviewResponse {
  summary: {
    total_students: number;
    active_last_7d: number;
    attention_needed: number;
    avg_score: number;
  };
  students: AdminStudent[];
}

export function AdminPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'students' | 'billing' | 'school'>('students');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'em_dia' | 'atencao' | 'inativo'>('all');
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);

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

  const students = (data?.students ?? []).filter((s) => {
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
          { id: 'students' as const, label: t('admin_tab_students'), icon: Users },
          { id: 'billing' as const, label: t('admin_tab_billing'), icon: CreditCard },
          { id: 'school' as const, label: t('admin_tab_school'), icon: Settings2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                tab === item.id
                  ? 'bg-[#D4AF37] text-[#0B1F3B]'
                  : 'border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
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
                    <th className="px-4 py-3">Nativo → Curso</th>
                    <th className="px-4 py-3">Dias / Tempo</th>
                    <th className="px-4 py-3">Desempenho</th>
                    <th className="px-4 py-3">SRS Atrasadas</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
                  {students.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      className="hover:bg-slate-50 dark:hover:bg-[#1F4E79]/20 cursor-pointer transition"
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{st.full_name}</p>
                        <p className="text-[11px] text-slate-400">{st.email || st.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#D4AF37]">{st.native_language}</span>
                        <span className="mx-1 text-slate-400">→</span>
                        <span>{st.target_language === 'es-ES' ? 'Espanhol' : 'Inglês'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{st.active_days} dias ativos</p>
                        <p className="text-[11px] text-slate-400">
                          ~{st.estimated_minutes} min (meta {st.daily_minutes_goal}m/dia)
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{st.avg_score}% média</p>
                        <p className="text-[11px] text-slate-400">{st.mastered_count} dominadas</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${
                            st.overdue_reviews > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {st.overdue_reviews} atrasadas
                        </span>
                        <p className="text-[11px] text-slate-400">{st.pending_reviews} pendentes</p>
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

          {selectedStudent && (
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-[#0B1F3B] text-white p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">
                    Detalhe de Acompanhamento
                  </span>
                  <h3 className="text-lg font-bold">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-slate-300">
                    {selectedStudent.email} • Foco: {selectedStudent.focus_area} • Meta CEFR:{' '}
                    {selectedStudent.target_cefr_level}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-[#06152B] p-3">
                  <p className="text-slate-400">Tentativas Totais</p>
                  <p className="text-base font-bold mt-0.5">{selectedStudent.total_attempts}</p>
                </div>
                <div className="rounded-xl bg-[#06152B] p-3">
                  <p className="text-slate-400">Tempo Estimado</p>
                  <p className="text-base font-bold mt-0.5">{selectedStudent.estimated_minutes} min</p>
                </div>
                <div className="rounded-xl bg-[#06152B] p-3">
                  <p className="text-slate-400">Última Atividade</p>
                  <p className="text-base font-bold mt-0.5">
                    {selectedStudent.last_activity_at
                      ? new Date(selectedStudent.last_activity_at).toLocaleDateString('pt-BR')
                      : 'Sem atividade'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#06152B] p-3">
                  <p className="text-slate-400">Agenda SRS</p>
                  <p className="text-base font-bold mt-0.5 text-amber-400">
                    {selectedStudent.overdue_reviews} atrasadas
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Plano Starter', price: 'R$ 79/mês', desc: 'A1-A2 + Agenda SRS + Prática IA limitada' },
            { name: 'Plano Pro IA', price: 'R$ 149/mês', desc: 'CEFR Completo + Fala Ilimitada + Voz Neural' },
            { name: 'Corporativo B2B', price: 'Sob consulta', desc: 'Gestão de equipes, KPIs e relatórios por empresa' },
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
              <p className="font-bold text-[#D4AF37] mb-1">Idiomas Nativos Suportados (Dicas & i18n)</p>
              <p>Português (Brasil) • Español • English</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
