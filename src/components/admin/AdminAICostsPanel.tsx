import { useState } from 'react';
import {
  Activity,
  Calculator,
  Cpu,
  DollarSign,
  Layers,
  Mic,
  Sparkles,
  TrendingUp,
  Volume2,
} from 'lucide-react';

export interface AIUsageSummary {
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  cost_last_30d_usd: number;
  cost_today_usd: number;
  by_model: Array<{
    model_name: string;
    provider: string;
    calls: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    avg_latency_ms: number;
  }>;
  by_agent: Array<{
    agent_name: string;
    calls: number;
    cost_usd: number;
  }>;
  by_student: Array<{
    student_id: string;
    full_name: string;
    calls: number;
    total_tokens: number;
    cost_usd: number;
  }>;
  recent_logs: Array<{
    created_at: string;
    student_name: string;
    agent_name: string;
    model_name: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    latency_ms: number;
  }>;
}

interface AdminAICostsPanelProps {
  aiUsage?: AIUsageSummary;
  activeStudentsCount: number;
}

const TUTOR_PROFILES = [
  {
    id: 'current',
    name: 'Atual: Texto + Áudio sob demanda',
    desc: 'Chat pedagógico + correção adaptativa + cliques de áudio TTS/STT por frase.',
    costPerLessonUsd: 0.004,
    models: 'Gemini Flash-Lite + Flash TTS',
  },
  {
    id: 'guided_voice',
    name: 'Tutor Guiado em Voz (Recomendado SaaS)',
    desc: 'Tutor explica a lição em áudio ao abrir + conduz 8 turnos de fala (STT + TTS neural).',
    costPerLessonUsd: 0.028,
    models: 'Gemini Flash-Lite + 2.5 Flash TTS',
  },
  {
    id: 'realtime_live',
    name: 'Conversação Livre em Tempo Real (Live API)',
    desc: 'Sessão contínua de voz bidirecional de 15 min por aula sem cliques.',
    costPerLessonUsd: 0.18,
    models: 'Gemini Live Audio (Native)',
  },
] as const;

const MODEL_CATALOG = [
  {
    name: 'gemini-flash-lite-latest',
    role: 'Chat Pedagógico, Avaliação Adaptativa & STT (áudio curto)',
    status: 'Conectado',
    pricing: 'US$ 0,075 / 1M in • US$ 0,30 / 1M out (áudio in ~US$ 0,30/1M)',
    notes: 'Melhor custo-benefício para SaaS. Latência baixa e ótimo em JSON estruturado.',
  },
  {
    name: 'gemini-2.5-flash-preview-tts',
    role: 'Voz Neural do Professor (TTS)',
    status: 'Conectado',
    pricing: 'US$ 0,50 / 1M texto in • US$ 10,00 / 1M tokens áudio out',
    notes: 'Voz natural ("Kore"). Ideal para o tutor explicar a aula em áudio para o aluno.',
  },
  {
    name: 'gemini-flash-latest',
    role: 'Tutoria Complexa / Explicações Gramaticais Avançadas (B2–C2)',
    status: 'Disponível (Provider)',
    pricing: 'US$ 0,15 / 1M in • US$ 0,60 / 1M out',
    notes: 'Já suportado no GeminiProvider. Use apenas em planos Pro ou níveis avançados.',
  },
  {
    name: 'Gemini Live API (Native Audio)',
    role: 'Conversação por Voz em Tempo Real (sem botão de gravar)',
    status: 'Próximo Upgrade',
    pricing: '~US$ 0,012 / minuto de conversa ativa (~US$ 0,18 por aula de 15m)',
    notes: 'Experiência premium estilo professor particular ao vivo via WebSocket/WebRTC.',
  },
];

function fmtUsd(v: number) {
  if (v > 0 && v < 0.01) return `$${v.toFixed(5)}`;
  return `$${v.toFixed(3)}`;
}

function fmtBrl(usd: number, rate: number) {
  const brl = usd * rate;
  if (brl > 0 && brl < 0.05) return `R$ ${brl.toFixed(4)}`;
  return `R$ ${brl.toFixed(2)}`;
}

export function AdminAICostsPanel({
  aiUsage,
  activeStudentsCount,
}: AdminAICostsPanelProps) {
  const [usdToBrl, setUsdToBrl] = useState(5.7);
  const [simStudents, setSimStudents] = useState(100);
  const [simLessonsPerMonth, setSimLessonsPerMonth] = useState(12);
  const [simPlanPriceBrl, setSimPlanPriceBrl] = useState(99);
  const [simProfileId, setSimProfileId] = useState<'current' | 'guided_voice' | 'realtime_live'>(
    'guided_voice'
  );

  const usage: AIUsageSummary = aiUsage ?? {
    total_calls: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cost_usd: 0,
    cost_last_30d_usd: 0,
    cost_today_usd: 0,
    by_model: [],
    by_agent: [],
    by_student: [],
    recent_logs: [],
  };

  const avgCostPerStudentUsd =
    activeStudentsCount > 0 ? usage.cost_last_30d_usd / activeStudentsCount : 0;

  const selectedProfile =
    TUTOR_PROFILES.find((p) => p.id === simProfileId) ?? TUTOR_PROFILES[1];
  const simCostPerStudentMonthUsd = selectedProfile.costPerLessonUsd * simLessonsPerMonth;
  const simCostPerStudentMonthBrl = simCostPerStudentMonthUsd * usdToBrl;
  const simTotalCostBrl = simCostPerStudentMonthBrl * simStudents;
  const simTotalRevenueBrl = simPlanPriceBrl * simStudents;
  const simGrossMarginPct =
    simTotalRevenueBrl > 0
      ? Math.max(0, ((simTotalRevenueBrl - simTotalCostBrl) / simTotalRevenueBrl) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Cotação + Aviso */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#0B1F3B] px-5 py-3.5 text-white">
        <div className="flex items-center gap-2.5 text-xs">
          <Cpu className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span>
            Telemetria em tempo real de <strong>core_ai.model_usage</strong> (Chat, Avaliação, TTS Neural e STT).
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <span>Cotação USD → BRL:</span>
          <input
            type="number"
            step="0.1"
            min="1"
            value={usdToBrl}
            onChange={(e) => setUsdToBrl(Math.max(1, Number(e.target.value) || 5.7))}
            className="w-20 rounded-lg border border-[#1F4E79] bg-[#06152B] px-2 py-1 text-xs font-bold text-[#D4AF37]"
          />
        </label>
      </div>

      {/* KPIs Reais de Consumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" /> Gasto Total (Acumulado)
          </p>
          <p className="text-2xl font-bold text-[#D4AF37] mt-1">
            {fmtBrl(usage.total_cost_usd, usdToBrl)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {fmtUsd(usage.total_cost_usd)} USD
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Últimos 30 dias / Hoje
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {fmtBrl(usage.cost_last_30d_usd, usdToBrl)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Hoje: {fmtBrl(usage.cost_today_usd, usdToBrl)} ({fmtUsd(usage.cost_today_usd)})
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-sky-400" /> Chamadas & Tokens
          </p>
          <p className="text-2xl font-bold mt-1">{usage.total_calls.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {(usage.total_input_tokens + usage.total_output_tokens).toLocaleString('pt-BR')} tokens
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-400" /> Custo Médio / Aluno (30d)
          </p>
          <p className="text-2xl font-bold mt-1">
            {fmtBrl(avgCostPerStudentUsd, usdToBrl)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Base: {activeStudentsCount} aluno(s)
          </p>
        </div>
      </div>

      {/* Consumo Real por Modelo e por Agente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1F4E79]/40 flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#D4AF37]" />
              Consumo Real por Modelo Conectado
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#06152B] text-slate-500 dark:text-slate-300 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Modelo</th>
                  <th className="px-4 py-2.5">Chamadas</th>
                  <th className="px-4 py-2.5">Tokens (In / Out)</th>
                  <th className="px-4 py-2.5">Latência</th>
                  <th className="px-4 py-2.5">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
                {usage.by_model.map((m) => (
                  <tr key={m.model_name}>
                    <td className="px-4 py-2.5">
                      <p className="font-bold">{m.model_name}</p>
                      <p className="text-[10px] text-slate-400">{m.provider}</p>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{m.calls}</td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {m.input_tokens.toLocaleString('pt-BR')} /{' '}
                      {m.output_tokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{m.avg_latency_ms} ms</td>
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-[#D4AF37]">{fmtBrl(m.cost_usd, usdToBrl)}</p>
                      <p className="text-[10px] text-slate-400">{fmtUsd(m.cost_usd)}</p>
                    </td>
                  </tr>
                ))}
                {usage.by_model.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Nenhuma chamada registrada ainda em <code>core_ai.model_usage</code>. Use o chat IA ou áudio em uma lição para ver os custos aqui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Por Agente + Top Alunos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              Gasto por Recurso / Agente
            </h3>
            {usage.by_agent.length === 0 ? (
              <p className="text-xs text-slate-400">Sem registros por agente ainda.</p>
            ) : (
              <div className="space-y-2">
                {usage.by_agent.map((ag) => (
                  <div
                    key={ag.agent_name}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-[#06152B] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      {ag.agent_name === 'NeuralTTS' ? (
                        <Volume2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                      ) : ag.agent_name === 'SpeechToText' ? (
                        <Mic className="h-3.5 w-3.5 text-sky-400" />
                      ) : (
                        <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {ag.agent_name}
                    </span>
                    <span className="text-slate-400">
                      {ag.calls}x •{' '}
                      <strong className="text-[#D4AF37]">
                        {fmtBrl(ag.cost_usd, usdToBrl)}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] p-4 space-y-3">
            <h3 className="text-sm font-bold">Custo por Aluno</h3>
            {usage.by_student.length === 0 ? (
              <p className="text-xs text-slate-400">Sem consumo por aluno registrado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {usage.by_student.map((st) => (
                  <div
                    key={st.student_id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-[#06152B] px-3 py-2 text-xs"
                  >
                    <span className="font-semibold truncate max-w-[160px]">{st.full_name}</span>
                    <span className="text-slate-400">
                      {st.calls}x •{' '}
                      <strong className="text-emerald-400">
                        {fmtBrl(st.cost_usd, usdToBrl)}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulador de Custos SaaS + Tutor de Voz */}
      <div className="rounded-3xl border border-[#D4AF37]/40 bg-[#0B1F3B] text-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Simulador de Custos & Margem SaaS
            </span>
            <h3 className="text-lg font-bold mt-0.5">
              Quanto custa evoluir para um Tutor de IA que explica a aula em áudio?
            </h3>
          </div>
        </div>

        {/* Seleção do Perfil de Tutor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TUTOR_PROFILES.map((prof) => {
            const active = simProfileId === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setSimProfileId(prof.id)}
                className={`text-left rounded-2xl border p-4 transition space-y-1.5 ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                    : 'border-[#1F4E79]/50 bg-[#06152B] hover:border-[#D4AF37]/50'
                }`}
              >
                <p className="text-xs font-bold text-[#D4AF37]">{prof.name}</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{prof.desc}</p>
                <p className="text-[11px] font-semibold text-emerald-400 pt-1">
                  ~{fmtBrl(prof.costPerLessonUsd, usdToBrl)} / aula ({fmtUsd(prof.costPerLessonUsd)})
                </p>
              </button>
            );
          })}
        </div>

        {/* Inputs + Resultado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-xs">
            <label className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3 space-y-1">
              <span className="text-slate-400 block">Alunos Ativos</span>
              <input
                type="number"
                min={1}
                value={simStudents}
                onChange={(e) => setSimStudents(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-transparent text-base font-bold text-white focus:outline-none"
              />
            </label>
            <label className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3 space-y-1">
              <span className="text-slate-400 block">Aulas/mês/aluno</span>
              <input
                type="number"
                min={1}
                value={simLessonsPerMonth}
                onChange={(e) => setSimLessonsPerMonth(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-transparent text-base font-bold text-white focus:outline-none"
              />
            </label>
            <label className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3 space-y-1">
              <span className="text-slate-400 block">Mensalidade (R$)</span>
              <input
                type="number"
                min={1}
                value={simPlanPriceBrl}
                onChange={(e) => setSimPlanPriceBrl(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-transparent text-base font-bold text-[#D4AF37] focus:outline-none"
              />
            </label>
          </div>

          <div className="lg:col-span-6 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400">Custo IA / Aluno / Mês</p>
              <p className="text-base font-bold text-amber-400 mt-1">
                {fmtBrl(simCostPerStudentMonthUsd, usdToBrl)}
              </p>
              <p className="text-[10px] text-slate-400">{fmtUsd(simCostPerStudentMonthUsd)}</p>
            </div>
            <div className="rounded-2xl bg-[#06152B] border border-[#1F4E79]/40 p-3">
              <p className="text-slate-400">Gasto Total Escola/Mês</p>
              <p className="text-base font-bold text-rose-400 mt-1">
                R$ {simTotalCostBrl.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400">
                Receita: R$ {simTotalRevenueBrl.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="rounded-2xl bg-[#06152B] border border-emerald-500/40 p-3">
              <p className="text-slate-400">Margem Bruta pós-IA</p>
              <p className="text-base font-bold text-emerald-400 mt-1">
                {simGrossMarginPct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-slate-400">
                Líquido: R$ {(simTotalRevenueBrl - simTotalCostBrl).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo de Modelos Conectados e Upgrades */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1F4E79]/40">
          <h3 className="text-sm font-bold">Mapa de Modelos de IA (Conectados & Próximos Upgrades)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#06152B] text-slate-500 dark:text-slate-300 uppercase">
              <tr>
                <th className="px-4 py-2.5">Modelo</th>
                <th className="px-4 py-2.5">Função no Produto</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Preço de Referência</th>
                <th className="px-4 py-2.5">Recomendação SaaS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
              {MODEL_CATALOG.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-3 font-bold text-[#D4AF37]">{item.name}</td>
                  <td className="px-4 py-3">{item.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'Conectado'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : item.status === 'Disponível (Provider)'
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.pricing}</td>
                  <td className="px-4 py-3 text-slate-400">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log de Auditoria Recente */}
      {usage.recent_logs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1F4E79]/40">
            <h3 className="text-sm font-bold">Últimas 15 Chamadas de IA Registradas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#06152B] text-slate-500 dark:text-slate-300 uppercase">
                <tr>
                  <th className="px-4 py-2">Data/Hora</th>
                  <th className="px-4 py-2">Aluno</th>
                  <th className="px-4 py-2">Agente</th>
                  <th className="px-4 py-2">Modelo</th>
                  <th className="px-4 py-2">Tokens</th>
                  <th className="px-4 py-2">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
                {usage.recent_logs.map((log, i) => (
                  <tr key={`${log.created_at}-${i}`}>
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(log.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2 font-semibold">{log.student_name}</td>
                    <td className="px-4 py-2">{log.agent_name}</td>
                    <td className="px-4 py-2 text-slate-400">{log.model_name}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {log.input_tokens} → {log.output_tokens}
                    </td>
                    <td className="px-4 py-2 font-bold text-[#D4AF37]">
                      {fmtBrl(log.cost_usd, usdToBrl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
