import { useEffect, useRef, useState, type ClipboardEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ImagePlus,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import {
  markSupportThreadRead,
  sendSupportMessage,
  updateSupportThreadStatus,
  uploadSupportAttachment,
  type SupportMessage,
  type SupportThread,
} from '@/lib/supportChat';
import { SupportMessageBubble } from '@/components/support/SupportMessageBubble';

interface StudentLookup {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
}

interface AdminSupportCenterProps {
  students: StudentLookup[];
  initialStudentFilter?: string | null;
  onRefreshOverview?: () => void;
}

export function AdminSupportCenter({
  students,
  initialStudentFilter,
  onRefreshOverview,
}: AdminSupportCenterProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['admin-support-threads'],
    refetchInterval: 6000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('core_learning')
        .from('support_threads')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportThread[];
    },
  });

  useEffect(() => {
    if (initialStudentFilter) {
      const studentInfo = studentMap.get(initialStudentFilter);
      if (studentInfo) {
        setSearchTerm(studentInfo.full_name);
      }
      const match = threads.find((t) => t.student_id === initialStudentFilter);
      if (match) setSelectedThreadId(match.id);
    }
  }, [initialStudentFilter, threads.length]);

  const enrichedThreads = threads.map((th) => {
    const st = studentMap.get(th.student_id);
    return {
      ...th,
      student_name: st?.full_name ?? 'Aluno',
      student_email: st?.email ?? '',
      course_title: th.course_title ?? st?.course_title ?? 'Curso JVX SPEAK',
    };
  });

  const filteredThreads = enrichedThreads.filter((th) => {
    const matchesStatus = statusFilter === 'all' || th.status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      th.student_name.toLowerCase().includes(q) ||
      th.student_email.toLowerCase().includes(q) ||
      (th.course_title ?? '').toLowerCase().includes(q) ||
      (th.lesson_title ?? '').toLowerCase().includes(q) ||
      th.subject.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const activeThread =
    enrichedThreads.find((t) => t.id === selectedThreadId) ?? filteredThreads[0] ?? null;

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-support-messages', activeThread?.id],
    enabled: Boolean(activeThread?.id),
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('core_learning')
        .from('support_messages')
        .select('*')
        .eq('thread_id', activeThread!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });

  useEffect(() => {
    if (activeThread && activeThread.unread_by_admin > 0) {
      markSupportThreadRead(activeThread.id, 'admin').then(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-support-threads'] });
        onRefreshOverview?.();
      });
    }
  }, [activeThread?.id, activeThread?.unread_by_admin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeThread?.id]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const attachFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Apenas imagens podem ser anexadas.');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          attachFile(file);
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!user || !activeThread || (!replyText.trim() && !pendingFile) || sending) return;
    setSending(true);
    setErrorMsg(null);

    try {
      let attachment: { url: string; name: string } | null = null;
      if (pendingFile) {
        attachment = await uploadSupportAttachment(user.id, pendingFile);
      }

      await sendSupportMessage({
        threadId: activeThread.id,
        senderId: user.id,
        senderRole: 'admin',
        body: replyText,
        attachment,
      });

      setReplyText('');
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(null);
      setPendingPreview(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-support-threads'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-support-messages', activeThread.id] }),
      ]);
      onRefreshOverview?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao responder.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeThread) return;
    const nextStatus = activeThread.status === 'resolved' ? 'open' : 'resolved';
    await updateSupportThreadStatus(activeThread.id, nextStatus);
    await queryClient.invalidateQueries({ queryKey: ['admin-support-threads'] });
    onRefreshOverview?.();
  };

  const statusBadge = (status: SupportThread['status']) => {
    if (status === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Resolvido
        </span>
      );
    }
    if (status === 'answered') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/20 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
          <Sparkles className="h-3 w-3" /> Respondido
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
        <Clock className="h-3 w-3" /> Aberto
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[540px]">
      {/* Left: Ticket Queue */}
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] flex flex-col overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 dark:border-[#1F4E79]/40 space-y-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por aluno, curso ou lição..."
              className="w-full rounded-xl border border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#06152B] pl-8 pr-3 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all' as const, label: 'Todos' },
              { id: 'open' as const, label: 'Abertos' },
              { id: 'answered' as const, label: 'Respondidos' },
              { id: 'resolved' as const, label: 'Resolvidos' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === f.id
                    ? 'bg-[#D4AF37] text-[#0B1F3B]'
                    : 'bg-slate-100 dark:bg-[#06152B] text-slate-500 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-[#1F4E79]/30">
          {isLoading && (
            <p className="p-4 text-xs text-slate-400">Carregando atendimentos...</p>
          )}
          {!isLoading && filteredThreads.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="h-6 w-6 mx-auto opacity-50" />
              <p>Nenhuma dúvida encontrada.</p>
            </div>
          )}
          {filteredThreads.map((th) => {
            const selected = activeThread?.id === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setSelectedThreadId(th.id)}
                className={`w-full text-left p-3.5 transition space-y-1.5 ${
                  selected
                    ? 'bg-[#D4AF37]/10 border-l-4 border-l-[#D4AF37]'
                    : 'hover:bg-slate-50 dark:hover:bg-[#1F4E79]/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{th.student_name}</span>
                  {statusBadge(th.status)}
                </div>
                <p className="text-xs font-medium text-[#D4AF37] truncate">{th.subject}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {th.course_title}
                  {th.lesson_title ? ` • ${th.lesson_title}` : ''}
                </p>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-slate-500">
                    {new Date(th.last_message_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {th.unread_by_admin > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {th.unread_by_admin} nova(s)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Active Chat Conversation */}
      <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-[#1F4E79]/40 bg-white dark:bg-[#0B1F3B] flex flex-col overflow-hidden">
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] px-5 py-3.5">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#D4AF37] shrink-0" />
                  <h3 className="text-sm font-bold truncate">{activeThread.student_name}</h3>
                  {statusBadge(activeThread.status)}
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                  <BookOpen className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>
                    {activeThread.course_title}
                    {activeThread.lesson_title ? ` • Lição: ${activeThread.lesson_title}` : ''}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleStatus}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 px-3 py-1.5 text-xs font-semibold hover:border-[#D4AF37] transition"
              >
                {activeThread.status === 'resolved' ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" /> Reabrir Chamado
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Marcar Resolvido
                  </>
                )}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[400px]">
              {messages.map((msg) => (
                <SupportMessageBubble
                  key={msg.id}
                  message={msg}
                  viewerRole="admin"
                  senderLabel={
                    msg.sender_role === 'admin'
                      ? 'Você (Professor / Admin)'
                      : activeThread.student_name
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Composer */}
            <div className="border-t border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#06152B] p-3.5 space-y-2">
              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
              {pendingPreview && (
                <div className="relative inline-block rounded-xl border border-[#D4AF37]/50 p-1">
                  <img
                    src={pendingPreview}
                    alt="Preview"
                    className="h-20 w-auto rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
                      setPendingFile(null);
                      setPendingPreview(null);
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) attachFile(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#0B1F3B] p-2.5 text-[#D4AF37] hover:border-[#D4AF37] transition"
                  title="Anexar imagem ou print"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Responder ao aluno... (pode colar print com Ctrl+V)"
                  className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#0B1F3B] px-3 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={sending || (!replyText.trim() && !pendingFile)}
                  onClick={handleSend}
                  className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#0B1F3B] hover:brightness-105 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Responder
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 opacity-40" />
            <p className="text-sm font-semibold">Selecione um atendimento à esquerda</p>
            <p className="text-xs max-w-sm">
              Quando os alunos enviarem dúvidas ou prints das lições, elas aparecerão aqui organizadas por aluno, curso e lição.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
