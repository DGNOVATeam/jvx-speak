-- ============================================================================
-- AI LANGUAGE SCHOOL — Migration 0002: RLS, Triggers & Security Functions
-- ============================================================================

-- 1. Schema Grants
GRANT USAGE ON SCHEMA core_identity, core_curriculum, core_learning, core_assessment, core_billing TO authenticated;
GRANT USAGE ON SCHEMA core_curriculum, core_billing TO anon;
GRANT ALL ON SCHEMA core_identity, core_curriculum, core_learning, core_assessment, core_ai, core_billing TO service_role;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA core_identity TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA core_curriculum TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core_curriculum TO authenticated; -- gated by RLS is_admin()
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA core_learning TO authenticated; -- gated by RLS
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA core_assessment TO authenticated; -- gated by RLS
GRANT SELECT ON ALL TABLES IN SCHEMA core_billing TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA core_identity, core_curriculum, core_learning, core_assessment, core_ai, core_billing TO service_role;

-- 2. Helper: is_admin()
CREATE OR REPLACE FUNCTION core_identity.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core_identity.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Trigger: Auto-provision student profile on signup
CREATE OR REPLACE FUNCTION core_identity.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO core_identity.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );

  INSERT INTO core_identity.student_preferences (student_id)
  VALUES (NEW.id);

  INSERT INTO core_identity.learning_goals (student_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core_identity.handle_new_user();

-- 4. Enable RLS on ALL tables
ALTER TABLE core_identity.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_identity.learning_goals ENABLE ROW LEVEL SECURITY;

ALTER TABLE core_curriculum.cefr_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.competency_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_curriculum.lesson_competencies ENABLE ROW LEVEL SECURITY;

ALTER TABLE core_learning.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.learning_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.mastery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_learning.review_schedule ENABLE ROW LEVEL SECURITY;

ALTER TABLE core_assessment.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_assessment.assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_assessment.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_assessment.rubric_scores ENABLE ROW LEVEL SECURITY;

ALTER TABLE core_ai.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.model_usage ENABLE ROW LEVEL SECURITY;

ALTER TABLE core_billing.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_billing.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- CORE_IDENTITY
CREATE POLICY "profiles_select_own_or_admin" ON core_identity.profiles
  FOR SELECT USING (id = auth.uid() OR core_identity.is_admin());

CREATE POLICY "profiles_update_own_non_role" ON core_identity.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM core_identity.profiles WHERE id = auth.uid()));

CREATE POLICY "prefs_own_all" ON core_identity.student_preferences
  FOR ALL USING (student_id = auth.uid() OR core_identity.is_admin())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "goals_own_all" ON core_identity.learning_goals
  FOR ALL USING (student_id = auth.uid() OR core_identity.is_admin())
  WITH CHECK (student_id = auth.uid());

-- CORE_CURRICULUM (Read for authenticated; Write only for admin)
CREATE POLICY "curriculum_read_cefr" ON core_curriculum.cefr_descriptors FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_admin_cefr" ON core_curriculum.cefr_descriptors FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_comp" ON core_curriculum.competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_admin_comp" ON core_curriculum.competencies FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_prereq" ON core_curriculum.competency_prerequisites FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_admin_prereq" ON core_curriculum.competency_prerequisites FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_courses" ON core_curriculum.courses FOR SELECT TO authenticated USING (is_published = true OR core_identity.is_admin());
CREATE POLICY "curriculum_admin_courses" ON core_curriculum.courses FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_units" ON core_curriculum.units FOR SELECT TO authenticated USING (is_published = true OR core_identity.is_admin());
CREATE POLICY "curriculum_admin_units" ON core_curriculum.units FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_lessons" ON core_curriculum.lessons FOR SELECT TO authenticated USING (is_published = true OR core_identity.is_admin());
CREATE POLICY "curriculum_admin_lessons" ON core_curriculum.lessons FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

CREATE POLICY "curriculum_read_lcomp" ON core_curriculum.lesson_competencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "curriculum_admin_lcomp" ON core_curriculum.lesson_competencies FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());

-- CORE_LEARNING (Student reads own; protected tables written only by service_role/Edge Functions)
CREATE POLICY "enrollments_own_select" ON core_learning.enrollments FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "enrollments_own_insert" ON core_learning.enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "sessions_own_all" ON core_learning.learning_sessions FOR ALL USING (student_id = auth.uid() OR core_identity.is_admin()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "activities_read" ON core_learning.activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "attempts_own_select" ON core_learning.attempts FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "evidence_own_select" ON core_learning.learning_evidence FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "mastery_own_select" ON core_learning.mastery_records FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "review_own_select" ON core_learning.review_schedule FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());

-- CORE_ASSESSMENT
CREATE POLICY "assessments_read" ON core_assessment.assessments FOR SELECT TO authenticated USING (is_published = true OR core_identity.is_admin());
CREATE POLICY "assessment_items_read" ON core_assessment.assessment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "assessment_attempts_own_select" ON core_assessment.assessment_attempts FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "rubric_scores_own_select" ON core_assessment.rubric_scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM core_assessment.assessment_attempts aa
    WHERE aa.id = assessment_attempt_id AND (aa.student_id = auth.uid() OR core_identity.is_admin())
  )
);

-- CORE_AI (Admin only for prompts and usage)
CREATE POLICY "ai_prompts_admin" ON core_ai.prompt_versions FOR ALL USING (core_identity.is_admin()) WITH CHECK (core_identity.is_admin());
CREATE POLICY "ai_interactions_own_or_admin" ON core_ai.ai_interactions FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());
CREATE POLICY "ai_usage_admin" ON core_ai.model_usage FOR SELECT USING (core_identity.is_admin());

-- CORE_BILLING
CREATE POLICY "plans_read_all" ON core_billing.plans FOR SELECT TO authenticated USING (is_active = true OR core_identity.is_admin());
CREATE POLICY "subscriptions_own_select" ON core_billing.subscriptions FOR SELECT USING (student_id = auth.uid() OR core_identity.is_admin());

-- ============================================================================
-- 6. RGPD / LGPD: Exportar próprios dados (JSON)
-- ============================================================================
CREATE OR REPLACE FUNCTION core_identity.export_my_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM core_identity.profiles p WHERE p.id = v_uid),
    'preferences', (SELECT to_jsonb(sp) FROM core_identity.student_preferences sp WHERE sp.student_id = v_uid),
    'goals', (SELECT COALESCE(jsonb_agg(to_jsonb(lg)), '[]'::jsonb) FROM core_identity.learning_goals lg WHERE lg.student_id = v_uid),
    'mastery', (SELECT COALESCE(jsonb_agg(to_jsonb(mr)), '[]'::jsonb) FROM core_learning.mastery_records mr WHERE mr.student_id = v_uid),
    'evidence_count', (SELECT count(*) FROM core_learning.learning_evidence le WHERE le.student_id = v_uid)
  );
END;
$$;
