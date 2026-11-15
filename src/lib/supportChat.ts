import { supabase } from '@/lib/supabase';

export interface SupportThread {
  id: string;
  student_id: string;
  course_id: string | null;
  lesson_id: string | null;
  course_title: string | null;
  lesson_title: string | null;
  subject: string;
  status: 'open' | 'answered' | 'resolved';
  unread_by_admin: number;
  unread_by_student: number;
  last_message_at: string;
  created_at: string;
  student_name?: string;
  student_email?: string;
}

export interface SupportMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: 'student' | 'admin';
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

export async function uploadSupportAttachment(
  userId: string,
  file: File
): Promise<{ url: string; name: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/${safeName}`;

  const { error } = await supabase.storage
    .from('support-attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (error) {
    throw new Error(`Falha ao enviar imagem: ${error.message}`);
  }

  const { data } = supabase.storage.from('support-attachments').getPublicUrl(path);
  return {
    url: data.publicUrl,
    name: file.name || `print-${safeName}`,
  };
}

export async function createSupportThread(params: {
  studentId: string;
  courseId?: string | null;
  lessonId?: string | null;
  courseTitle?: string | null;
  lessonTitle?: string | null;
  subject: string;
}): Promise<SupportThread> {
  const { data, error } = await supabase
    .schema('core_learning')
    .from('support_threads')
    .insert({
      student_id: params.studentId,
      course_id: params.courseId ?? null,
      lesson_id: params.lessonId ?? null,
      course_title: params.courseTitle ?? null,
      lesson_title: params.lessonTitle ?? null,
      subject: params.subject.trim() || 'Dúvida na lição',
      status: 'open',
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível criar o atendimento.');
  }

  return data as SupportThread;
}

export async function sendSupportMessage(params: {
  threadId: string;
  senderId: string;
  senderRole: 'student' | 'admin';
  body: string;
  attachment?: { url: string; name: string } | null;
}): Promise<SupportMessage> {
  const { data, error } = await supabase
    .schema('core_learning')
    .from('support_messages')
    .insert({
      thread_id: params.threadId,
      sender_id: params.senderId,
      sender_role: params.senderRole,
      body: params.body.trim(),
      attachment_url: params.attachment?.url ?? null,
      attachment_name: params.attachment?.name ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Não foi possível enviar a mensagem.');
  }

  return data as SupportMessage;
}

export async function markSupportThreadRead(
  threadId: string,
  viewerRole: 'student' | 'admin'
): Promise<void> {
  const patch =
    viewerRole === 'admin' ? { unread_by_admin: 0 } : { unread_by_student: 0 };

  await supabase
    .schema('core_learning')
    .from('support_threads')
    .update(patch)
    .eq('id', threadId);
}

export async function updateSupportThreadStatus(
  threadId: string,
  status: 'open' | 'answered' | 'resolved'
): Promise<void> {
  const { error } = await supabase
    .schema('core_learning')
    .from('support_threads')
    .update({ status })
    .eq('id', threadId);

  if (error) {
    throw new Error(error.message);
  }
}
