import { z } from 'npm:zod@3.24.2';

// ============================================================================
// Contratos dos Agentes de IA — Fase 1 (Funcionais: TeacherAgent & AdaptiveTutorAgent)
// ============================================================================

export const TeacherAgentOutputSchema = z.object({
  reply_en: z.string().min(1),
  explanation_pt: z.string().optional(),
  inline_corrections: z
    .array(
      z.object({
        original: z.string(),
        corrected: z.string(),
        reason_pt: z.string(),
      })
    )
    .default([]),
  suggested_next_prompts: z.array(z.string()).max(3).default([]),
  word_bank: z
    .array(
      z.object({
        en: z.string(),
        pt: z.string(),
      })
    )
    .max(6)
    .default([]),
  lesson_progress_pct: z.number().min(0).max(100),
});

export type TeacherAgentOutput = z.infer<typeof TeacherAgentOutputSchema>;

export interface TeacherAgentInput {
  cefrLevel: string;
  lessonTitle: string;
  lessonObjectives: string[];
  targetChunks: Array<{ chunk: string; pt: string }>;
  history: Array<{ role: 'student' | 'teacher'; text: string }>;
  studentMessage: string;
}

export const AdaptiveTutorOutputSchema = z.object({
  feedback_pt: z.string().min(1),
  score_0_100: z.number().min(0).max(100),
  detected_error_tags: z.array(z.string()).default([]),
  adapted_exercise: z
    .object({
      question: z.string(),
      hint_pt: z.string(),
      expected_chunks: z.array(z.string()),
    })
    .optional(),
});

export type AdaptiveTutorOutput = z.infer<typeof AdaptiveTutorOutputSchema>;

// ============================================================================
// Contratos Preparados (Fase 2+ — Não funcionais na Fase 1)
// ============================================================================

export interface ConversationAgentContract {
  status: 'planned_phase_2';
  startVoiceSession(params: { studentId: string; cefrLevel: string; scenario: string }): Promise<never>;
}

export interface AssessmentAgentContract {
  status: 'planned_phase_2';
  evaluateCefrAttempt(params: { assessmentAttemptId: string }): Promise<never>;
}

export interface StudyPlannerAgentContract {
  status: 'planned_phase_2';
  generateWeeklyPlan(params: { studentId: string; minutesPerDay: number }): Promise<never>;
}

export interface ReviewAgentContract {
  status: 'planned_phase_2';
  generateSrsCards(params: { studentId: string; competencyId: string }): Promise<never>;
}
