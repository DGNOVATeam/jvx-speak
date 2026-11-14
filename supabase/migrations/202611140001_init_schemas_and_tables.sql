-- ============================================================================
-- AI LANGUAGE SCHOOL — Migration 0001: Schemas, Tables & Indexes
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. SCHEMAS
CREATE SCHEMA IF NOT EXISTS core_identity;
CREATE SCHEMA IF NOT EXISTS core_curriculum;
CREATE SCHEMA IF NOT EXISTS core_learning;
CREATE SCHEMA IF NOT EXISTS core_assessment;
CREATE SCHEMA IF NOT EXISTS core_ai;
CREATE SCHEMA IF NOT EXISTS core_billing;

-- ============================================================================
-- 2. CORE_IDENTITY
-- ============================================================================
CREATE TABLE core_identity.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  full_name text,
  native_language text NOT NULL DEFAULT 'pt-BR',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_identity.student_preferences (
  student_id uuid PRIMARY KEY REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  ui_locale text NOT NULL DEFAULT 'pt-BR' CHECK (ui_locale IN ('pt-BR', 'es', 'en')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  daily_minutes_goal integer NOT NULL DEFAULT 20 CHECK (daily_minutes_goal BETWEEN 5 AND 240),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_identity.learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  target_cefr_level text NOT NULL DEFAULT 'B2' CHECK (target_cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  focus_area text NOT NULL DEFAULT 'business_entrepreneur' CHECK (focus_area IN ('general', 'business_entrepreneur', 'tech', 'travel')),
  weekly_sessions_target integer NOT NULL DEFAULT 5 CHECK (weekly_sessions_target BETWEEN 1 AND 14),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_goals_student ON core_identity.learning_goals(student_id);

-- ============================================================================
-- 3. CORE_CURRICULUM
-- ============================================================================
CREATE TABLE core_curriculum.cefr_descriptors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  skill_category text NOT NULL CHECK (skill_category IN ('listening', 'reading', 'spoken_interaction', 'spoken_production', 'writing')),
  source_name text NOT NULL,
  source_version text NOT NULL,
  official_code text,
  descriptor_text text NOT NULL,
  is_official_reference boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_curriculum.competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  skill_category text NOT NULL CHECK (skill_category IN ('listening', 'reading', 'spoken_interaction', 'spoken_production', 'writing')),
  title text NOT NULL,
  description text NOT NULL,
  cefr_descriptor_id uuid REFERENCES core_curriculum.cefr_descriptors(id) ON DELETE SET NULL,
  mastery_threshold numeric(5,2) NOT NULL DEFAULT 75.00 CHECK (mastery_threshold BETWEEN 50 AND 100),
  min_evidences_required integer NOT NULL DEFAULT 3 CHECK (min_evidences_required >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competencies_level ON core_curriculum.competencies(cefr_level, skill_category);

CREATE TABLE core_curriculum.competency_prerequisites (
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  PRIMARY KEY (competency_id, prerequisite_id),
  CHECK (competency_id <> prerequisite_id)
);

CREATE TABLE core_curriculum.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  target_cefr_level text NOT NULL CHECK (target_cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  focus_area text NOT NULL DEFAULT 'general',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_curriculum.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES core_curriculum.courses(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  title text NOT NULL,
  description text NOT NULL,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  completion_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, order_index)
);

CREATE TABLE core_curriculum.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES core_curriculum.units(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  title text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'mixed' CHECK (lesson_type IN ('input', 'ai_practice', 'exercise', 'mixed')),
  estimated_minutes integer NOT NULL DEFAULT 15,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  vocabulary_chunks jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, order_index)
);

CREATE TABLE core_curriculum.lesson_competencies (
  lesson_id uuid NOT NULL REFERENCES core_curriculum.lessons(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  weight numeric(4,2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (lesson_id, competency_id)
);

-- ============================================================================
-- 4. CORE_LEARNING
-- ============================================================================
CREATE TABLE core_learning.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES core_curriculum.courses(id) ON DELETE CASCADE,
  estimated_cefr_level text NOT NULL DEFAULT 'A1' CHECK (estimated_cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE core_learning.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES core_curriculum.lessons(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer
);
CREATE INDEX idx_learning_sessions_student ON core_learning.learning_sessions(student_id, started_at DESC);

CREATE TABLE core_learning.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES core_curriculum.lessons(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('multiple_choice', 'fill_blank', 'sentence_build', 'ai_dialogue', 'writing_prompt')),
  difficulty text NOT NULL DEFAULT 'basic' CHECK (difficulty IN ('basic', 'intermediate', 'advanced')),
  prompt_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_learning.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES core_learning.activities(id) ON DELETE SET NULL,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  session_id uuid REFERENCES core_learning.learning_sessions(id) ON DELETE SET NULL,
  student_response jsonb NOT NULL,
  is_correct boolean,
  score_0_100 numeric(5,2) NOT NULL CHECK (score_0_100 BETWEEN 0 AND 100),
  feedback_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_student_comp ON core_learning.attempts(student_id, competency_id, created_at DESC);

CREATE TABLE core_learning.learning_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES core_learning.attempts(id) ON DELETE SET NULL,
  evidence_type text NOT NULL CHECK (evidence_type IN ('exercise', 'ai_dialogue', 'diagnostic', 'assessment', 'review')),
  score_0_100 numeric(5,2) NOT NULL CHECK (score_0_100 BETWEEN 0 AND 100),
  weight numeric(4,2) NOT NULL DEFAULT 1.00,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidence_student_comp ON core_learning.learning_evidence(student_id, competency_id, created_at DESC);

CREATE TABLE core_learning.mastery_records (
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  mastery_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  confidence numeric(4,3) NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  evidence_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('locked', 'in_progress', 'mastered')),
  last_practiced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, competency_id)
);

CREATE TABLE core_learning.review_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES core_curriculum.competencies(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor numeric(4,2) NOT NULL DEFAULT 2.50,
  repetitions integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, competency_id)
);
CREATE INDEX idx_review_due ON core_learning.review_schedule(student_id, status, due_at);

-- ============================================================================
-- 5. CORE_ASSESSMENT
-- ============================================================================
CREATE TABLE core_assessment.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('diagnostic', 'unit_formative', 'cefr_gate')),
  cefr_level text CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  passing_score numeric(5,2) NOT NULL DEFAULT 75.00,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_assessment.assessment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES core_assessment.assessments(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES core_curriculum.competencies(id) ON DELETE SET NULL,
  order_index integer NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('multiple_choice', 'fill_blank', 'writing', 'reading_comprehension')),
  prompt_data jsonb NOT NULL,
  rubric_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_points numeric(5,2) NOT NULL DEFAULT 10.00,
  UNIQUE (assessment_id, order_index)
);

CREATE TABLE core_assessment.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES core_assessment.assessments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'validated')),
  internal_score_0_100 numeric(5,2),
  estimated_cefr_level text CHECK (estimated_cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  passed boolean,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX idx_assessment_attempts_student ON core_assessment.assessment_attempts(student_id, started_at DESC);

CREATE TABLE core_assessment.rubric_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_attempt_id uuid NOT NULL REFERENCES core_assessment.assessment_attempts(id) ON DELETE CASCADE,
  assessment_item_id uuid NOT NULL REFERENCES core_assessment.assessment_items(id) ON DELETE CASCADE,
  criterion_name text NOT NULL,
  score numeric(5,2) NOT NULL,
  max_score numeric(5,2) NOT NULL,
  evaluator_type text NOT NULL CHECK (evaluator_type IN ('deterministic', 'ai_validated')),
  justification text
);

-- ============================================================================
-- 6. CORE_AI
-- ============================================================================
CREATE TABLE core_ai.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  version text NOT NULL,
  system_prompt text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_name, version)
);

CREATE TABLE core_ai.ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  prompt_version_id uuid REFERENCES core_ai.prompt_versions(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES core_curriculum.lessons(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'blocked')),
  sanitized_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_interactions_student ON core_ai.ai_interactions(student_id, created_at DESC);

CREATE TABLE core_ai.model_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES core_ai.ai_interactions(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model_name text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. CORE_BILLING
-- ============================================================================
CREATE TABLE core_billing.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  monthly_ai_token_limit integer NOT NULL DEFAULT 100000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE core_billing.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES core_identity.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES core_billing.plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_student ON core_billing.subscriptions(student_id);
