-- ============================================================================
-- Migration 0002: Daily Presence Calendar, Study Heartbeat & Student Support Chat
-- ============================================================================

-- 1. Daily Presence & Study Time Tracking
CREATE TABLE IF NOT EXISTS core_learning.daily_presence (
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  seconds_spent integer NOT NULL DEFAULT 0 CHECK (seconds_spent >= 0),
  sessions_count integer NOT NULL DEFAULT 1 CHECK (sessions_count >= 0),
  last_lesson_id uuid REFERENCES core_curriculum.lessons(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_presence_student_date
  ON core_learning.daily_presence(student_id, activity_date DESC);

-- Backfill historical activity days from existing attempts
INSERT INTO core_learning.daily_presence (student_id, activity_date, seconds_spent, sessions_count, last_seen_at)
SELECT
  a.student_id,
  (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS activity_date,
  GREATEST(COUNT(*) * 180, 180)::integer AS seconds_spent,
  1 AS sessions_count,
  MAX(a.created_at) AS last_seen_at
FROM core_learning.attempts a
GROUP BY a.student_id, (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date
ON CONFLICT (student_id, activity_date) DO NOTHING;

-- Heartbeat RPC called by the frontend when the student uses the app or studies a lesson
CREATE OR REPLACE FUNCTION core_learning.record_study_heartbeat(
  p_lesson_id uuid DEFAULT NULL,
  p_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_safe_seconds integer := LEAST(GREATEST(COALESCE(p_seconds, 0), 0), 300);
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO core_learning.daily_presence (
    student_id,
    activity_date,
    seconds_spent,
    sessions_count,
    last_lesson_id,
    last_seen_at
  )
  VALUES (
    v_user_id,
    v_today,
    v_safe_seconds,
    1,
    p_lesson_id,
    now()
  )
  ON CONFLICT (student_id, activity_date) DO UPDATE SET
    seconds_spent = core_learning.daily_presence.seconds_spent + v_safe_seconds,
    sessions_count = CASE
      WHEN core_learning.daily_presence.last_seen_at < now() - interval '30 minutes'
      THEN core_learning.daily_presence.sessions_count + 1
      ELSE core_learning.daily_presence.sessions_count
    END,
    last_lesson_id = COALESCE(EXCLUDED.last_lesson_id, core_learning.daily_presence.last_lesson_id),
    last_seen_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION core_learning.record_study_heartbeat(uuid, integer) TO authenticated;

-- 2. Student-Teacher Support Chat (Help por Lição / Curso)
CREATE TABLE IF NOT EXISTS core_learning.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES core_curriculum.courses(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES core_curriculum.lessons(id) ON DELETE SET NULL,
  course_title text,
  lesson_title text,
  subject text NOT NULL DEFAULT 'Dúvida na lição',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved')),
  unread_by_admin integer NOT NULL DEFAULT 0,
  unread_by_student integer NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_threads_student
  ON core_learning.support_threads(student_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_threads_status
  ON core_learning.support_threads(status, last_message_at DESC);

CREATE TABLE IF NOT EXISTS core_learning.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES core_learning.support_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'admin')),
  body text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread
  ON core_learning.support_messages(thread_id, created_at ASC);

-- Trigger to keep thread unread counters, status and last_message_at updated
CREATE OR REPLACE FUNCTION core_learning.handle_new_support_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE core_learning.support_threads
  SET
    last_message_at = NEW.created_at,
    status = CASE
      WHEN NEW.sender_role = 'student' THEN 'open'
      WHEN NEW.sender_role = 'admin' THEN 'answered'
      ELSE status
    END,
    unread_by_admin = CASE
      WHEN NEW.sender_role = 'student' THEN unread_by_admin + 1
      ELSE 0
    END,
    unread_by_student = CASE
      WHEN NEW.sender_role = 'admin' THEN unread_by_student + 1
      ELSE 0
    END
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_support_message_inserted ON core_learning.support_messages;
CREATE TRIGGER on_support_message_inserted
  AFTER INSERT ON core_learning.support_messages
  FOR EACH ROW EXECUTE FUNCTION core_learning.handle_new_support_message();

-- 3. Grants & RLS Policies
GRANT SELECT, INSERT, UPDATE ON core_learning.daily_presence TO authenticated;
GRANT SELECT, INSERT, UPDATE ON core_learning.support_threads TO authenticated;
GRANT SELECT, INSERT ON core_learning.support_messages TO authenticated;

ALTER TABLE core_learning.daily_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.support_messages ENABLE ROW LEVEL SECURITY;

-- daily_presence policies
DROP POLICY IF EXISTS daily_presence_select ON core_learning.daily_presence;
CREATE POLICY daily_presence_select ON core_learning.daily_presence
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR core_identity.is_admin());

DROP POLICY IF EXISTS daily_presence_insert ON core_learning.daily_presence;
CREATE POLICY daily_presence_insert ON core_learning.daily_presence
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR core_identity.is_admin());

DROP POLICY IF EXISTS daily_presence_update ON core_learning.daily_presence;
CREATE POLICY daily_presence_update ON core_learning.daily_presence
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR core_identity.is_admin())
  WITH CHECK (student_id = auth.uid() OR core_identity.is_admin());

-- support_threads policies
DROP POLICY IF EXISTS support_threads_select ON core_learning.support_threads;
CREATE POLICY support_threads_select ON core_learning.support_threads
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR core_identity.is_admin());

DROP POLICY IF EXISTS support_threads_insert ON core_learning.support_threads;
CREATE POLICY support_threads_insert ON core_learning.support_threads
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR core_identity.is_admin());

DROP POLICY IF EXISTS support_threads_update ON core_learning.support_threads;
CREATE POLICY support_threads_update ON core_learning.support_threads
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR core_identity.is_admin())
  WITH CHECK (student_id = auth.uid() OR core_identity.is_admin());

-- support_messages policies
DROP POLICY IF EXISTS support_messages_select ON core_learning.support_messages;
CREATE POLICY support_messages_select ON core_learning.support_messages
  FOR SELECT TO authenticated
  USING (
    core_identity.is_admin()
    OR EXISTS (
      SELECT 1 FROM core_learning.support_threads t
      WHERE t.id = thread_id AND t.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS support_messages_insert ON core_learning.support_messages;
CREATE POLICY support_messages_insert ON core_learning.support_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (sender_role = 'admin' AND core_identity.is_admin())
      OR (
        sender_role = 'student'
        AND EXISTS (
          SELECT 1 FROM core_learning.support_threads t
          WHERE t.id = thread_id AND t.student_id = auth.uid()
        )
      )
    )
  );

-- 4. Storage Bucket for Support Chat Screenshots/Attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "support_attachments_upload" ON storage.objects;
CREATE POLICY "support_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "support_attachments_read" ON storage.objects;
CREATE POLICY "support_attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'support-attachments');
