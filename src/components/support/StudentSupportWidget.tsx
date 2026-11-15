import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import { useMatch } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  ImagePlus,
  LifeBuoy,
  MessageSquarePlus,
  Send,
  Sparkles,
  X,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import {
  createSupportThread,
  markSupportThreadRead,
  sendSupportMessage,
  uploadSupportAttachment,
  type SupportMessage,
  type SupportThread,
} from '@/lib/supportChat';
import { SupportMessageBubble } from '@/components/support/SupportMessageBubble';

export function openStudentSupportChat() {
  window.dispatchEvent(new CustomEvent('jvx:open-support'));
}

export function StudentSupportWidget() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const lessonMatch = useMatch('/lessons/:lessonId');
  const activeLessonId = lessonMatch?.params?.lessonId ?? null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('jvx:open-support', handler);
    return () => window.removeEventListener('jvx:open-support', handler);
  }, []);

  // Fetch current lesson & course context when inside a lesson
  const { data: lessonContext } = useQuery({
    queryKey: ['support-lesson-context', activeLessonId],
    enabled: Boolean(activeLessonId && user),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_curriculum')
        .from('lessons')
        .select('id, title, unit:units(title, course:courses(id, title))')
        .eq('id', activeLessonId!)
        .maybeSingle();

      if (!data) return null;
      const unit = data.unit as {
        title?: string;
        course?: { id?: string; title?: string } | null;
      } | null;
      return {
        lessonId: data.id as string,
        lessonTitle: data.title as string,
        courseId: unit?.course?.id ?? null,
        courseTitle: unit?.course?.title ?? 'Curso JVX SPEAK',
      };
    },
  });

  // Fallback enrolled course context if not inside a lesson
  const { data: enrolledCourse } = useQuery({
    queryKey: ['support-enrolled-course', user?.id],
    enabled: Boolean(user && !activeLessonId),
    queryFn: async () => {
      const { data } = await supabase
        .schema('core_learning')
        .from('enrollments')
        .select('course:courses(id, title)')
        .eq('student_id', user!.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      const c = data?.course as { id?: string; title?: string } | null;
      return c ? { courseId: c.id ?? null, courseTitle: c.title ?? 'Curso JVX SPEAK' } : null;
    },
  });

  // Fetch student's threads
  const { data: threads = [] } = useQuery({
    queryKey: ['student-support-threads', user?.id],
    enabled: Boolean(user),
    refetchInterval: isOpen ? 6000 : 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('core_learning')
        .from('support_threads')
        .select('*')
        .eq('student_id', user!.id)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportThread[];
    },
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  // Fetch messages of active thread
  const { data: messages = [] } = useQuery({
    queryKey: ['student-support-messages', activeThreadId],
    enabled: Boolean(activeThreadId && isOpen),
    refetchInterval: isOpen ? 5000 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('core_learning')
        .from('support_messages')
        .select('*')
        .eq('thread_id', activeThreadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });

  // Mark thread as read when opened
  useEffect(() => {
    if (isOpen && activeThread && activeThread.unread_by_student > 0) {
      markSupportThreadRead(activeThread.id, 'student').then(() => {
        queryClient.invalidateQueries({ queryKey: ['student-support-threads', user?.id] });
      });
    }
  }, [isOpen, activeThread, queryClient, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeThreadId]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  if (!user || profile?.role === 'admin') {
    // Admin uses the dedicated Admin Support Center in /admin, though can also see nothing floating here
    return null;
  }

  const totalUnread = threads.reduce((acc, t) => acc + Number(t.unread_by_student ?? 0), 0);

  const attachImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Apenas imagens (PNG, JPG, WEBP) podem ser anexadas.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5 MB.');
      return;
    }
    setErrorMsg(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          attachImageFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) attachImageFile(file);
  };

  const clearAttachment = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleSend = async () => {
    if ((!body.trim() && !pendingFile) || sending) return;
    setSending(true);
    setErrorMsg(null);

    try {
      let targetThreadId = activeThreadId;
      if (!targetThreadId) {
        const created = await createSupportThread({
          studentId: user.id,
          courseId: lessonContext?.courseId ?? enrolledCourse?.courseId ?? null,
          lessonId: lessonContext?.lessonId ?? null,
          courseTitle: lessonContext?.courseTitle ?? enrolledCourse?.courseTitle ?? 'Curso JVX SPEAK',
          lessonTitle: lessonContext?.lessonTitle ?? null,
          subject:
            subject.trim() ||
            (lessonContext?.lessonTitle
              ? `Dúvida: ${lessonContext.lessonTitle}`
              : 'Dúvida com o Professor'),
        });
        targetThreadId = created.id;
        setActiveThreadId(created.id);
        setCreatingNew(false);
        setSubject('');
      }

      let attachment: { url: string; name: string } | null = null;
      if (pendingFile) {
        attachment = await uploadSupportAttachment(user.id, pendingFile);
      }

      await sendSupportMessage({
        threadId: targetThreadId,
        senderId: user.id,
        senderRole: 'student',
        body,
        attachment,
      });

      setBody('');
      clearAttachment();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['student-support-threads', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['student-support-messages', targetThreadId] }),
      ]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar dúvida.');
    } finally {
      setSending(false);
    }
  };

  const statusPill = (status: SupportThread['status']) => {
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
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
        <Clock className="h-3 w-3" /> Aguardando
      </span>
    );
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0B1F3B] to-[#143563] border border-[#D4AF37]/50 px-4 py-3 text-xs font-bold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition"
        aria-label="Abrir atendimento ao aluno"
      >
        <LifeBuoy className="h-4 w-4 text-[#D4AF37]" />
        <span>Ajuda / Professor</span>
        {totalUnread > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[10px] font-extrabold text-[#0B1F3B]">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Slide-over Support Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
          <div
            className="flex h-full w-full max-w-md flex-col bg-white dark:bg-[#06152B] text-[#0B1F3B] dark:text-white border-l border-slate-200 dark:border-[#1F4E79]/60 shadow-2xl"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1F4E79]/50 bg-[#0B1F3B] px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {(activeThreadId || creatingNew) && threads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveThreadId(null);
                      setCreatingNew(false);
                    }}
                    className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                    title="Voltar para minhas dúvidas"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">Atendimento JVX SPEAK</p>
                  <p className="text-[11px] text-slate-300 truncate">
                    {lessonContext
                      ? `${lessonContext.courseTitle} • ${lessonContext.lessonTitle}`
                      : enrolledCourse?.courseTitle ?? 'Suporte Pedagógico'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Fechar atendimento"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thread List View */}
            {!activeThreadId && !creatingNew && threads.length > 0 ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Suas Dúvidas ({threads.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreatingNew(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#0B1F3B] hover:brightness-105 transition"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Nova Dúvida
                  </button>
                </div>

                <div className="space-y-2">
                  {threads.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setActiveThreadId(th.id)}
                      className="w-full text-left rounded-2xl border border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#0B1F3B] p-3.5 hover:border-[#D4AF37]/60 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">{th.subject}</span>
                        {statusPill(th.status)}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {th.course_title || 'Curso'}
                        {th.lesson_title ? ` • ${th.lesson_title}` : ''}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(th.last_message_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {th.unread_by_student > 0 && (
                          <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-[#0B1F3B]">
                            {th.unread_by_student} nova(s)
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Conversation or New Thread Composer */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeThread ? (
                    <div className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/40 bg-slate-50 dark:bg-[#0B1F3B] px-3 py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{activeThread.subject}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {activeThread.course_title}
                          {activeThread.lesson_title ? ` • ${activeThread.lesson_title}` : ''}
                        </p>
                      </div>
                      {statusPill(activeThread.status)}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3.5 space-y-2">
                      <p className="text-xs font-bold text-[#D4AF37]">
                        Envie sua dúvida ao Professor
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Você pode escrever sua pergunta e até <strong>colar um print da tela (Ctrl+V)</strong> diretamente aqui no chat.
                      </p>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={
                          lessonContext?.lessonTitle
                            ? `Assunto (ex: Dúvida na lição ${lessonContext.lessonTitle})`
                            : 'Assunto da dúvida...'
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#06152B] px-3 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  )}

                  {messages.map((msg) => (
                    <SupportMessageBubble
                      key={msg.id}
                      message={msg}
                      viewerRole="student"
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="border-t border-slate-200 dark:border-[#1F4E79]/50 bg-slate-50 dark:bg-[#0B1F3B] p-3 space-y-2">
                  {errorMsg && (
                    <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
                  )}

                  {pendingPreview && (
                    <div className="relative inline-block rounded-xl border border-[#D4AF37]/50 bg-black/20 p-1">
                      <img
                        src={pendingPreview}
                        alt="Pré-visualização do print"
                        className="h-20 w-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={clearAttachment}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-500 p-1 text-white shadow"
                        aria-label="Remover print"
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
                        if (file) attachImageFile(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#06152B] p-2.5 text-slate-500 dark:text-[#D4AF37] hover:border-[#D4AF37] transition shrink-0"
                      title="Anexar print ou imagem"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>

                    <textarea
                      rows={2}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Escreva sua dúvida ou cole um print (Ctrl+V)..."
                      className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-[#1F4E79]/60 bg-white dark:bg-[#06152B] px-3 py-2 text-xs focus:border-[#D4AF37] focus:outline-none"
                    />

                    <button
                      type="button"
                      disabled={sending || (!body.trim() && !pendingFile)}
                      onClick={handleSend}
                      className="rounded-xl bg-[#D4AF37] p-2.5 text-[#0B1F3B] font-bold hover:brightness-105 disabled:opacity-40 transition shrink-0"
                      title="Enviar"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
