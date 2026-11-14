// ============================================================================
// PedagogicalEngine — Motor Pedagógico Determinístico (Compartilhado)
// ============================================================================

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ActivityType = 'review' | 'input_lesson' | 'ai_dialogue' | 'exercise' | 'unit_assessment';
export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export interface CompetencyNode {
  id: string;
  code: string;
  cefrLevel: CefrLevel;
  skillCategory: 'listening' | 'reading' | 'spoken_interaction' | 'spoken_production' | 'writing';
  title: string;
  masteryThreshold: number; // ex: 75
  minEvidencesRequired: number; // ex: 3
  prerequisiteIds: string[];
}

export interface MasteryState {
  competencyId: string;
  masteryScore: number; // 0-100
  confidence: number; // 0-1
  evidenceCount: number;
  status: 'locked' | 'in_progress' | 'mastered';
}

export interface DueReviewItem {
  competencyId: string;
  dueAt: string; // ISO
  repetitions: number;
}

export interface EvidencePoint {
  score0To100: number;
  weight: number;
  createdAt: string;
}

export interface PedagogicalDecision {
  studentId: string;
  competencyId: string | null;
  recommendedActivityType: ActivityType;
  difficulty: DifficultyLevel;
  reason: string;
  prerequisitesSatisfied: boolean;
}

const CEFR_ORDER: Record<CefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export class PedagogicalEngine {
  /**
   * Verifica se todos os pré-requisitos de uma competência foram dominados.
   */
  static arePrerequisitesSatisfied(
    competency: CompetencyNode,
    masteryMap: Map<string, MasteryState>
  ): boolean {
    if (competency.prerequisiteIds.length === 0) return true;
    return competency.prerequisiteIds.every((prereqId) => {
      const state = masteryMap.get(prereqId);
      return state?.status === 'mastered';
    });
  }

  /**
   * Recalcula domínio (0-100) e confiança (0-1) a partir do histórico de evidências.
   * Nunca marca como 'mastered' com apenas 1 exercício correto.
   */
  static computeMasteryUpdate(
    competency: CompetencyNode,
    evidences: EvidencePoint[]
  ): Omit<MasteryState, 'competencyId'> {
    if (evidences.length === 0) {
      return {
        masteryScore: 0,
        confidence: 0,
        evidenceCount: 0,
        status: 'in_progress',
      };
    }

    // Ordena da mais antiga para a mais recente para dar peso maior às evidências recentes
    const sorted = [...evidences].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let weightedSum = 0;
    let totalWeight = 0;

    sorted.forEach((ev, idx) => {
      const recencyFactor = 1 + idx * 0.15;
      const effectiveWeight = ev.weight * recencyFactor;
      weightedSum += ev.score0To100 * effectiveWeight;
      totalWeight += effectiveWeight;
    });

    const masteryScore = Number((weightedSum / totalWeight).toFixed(2));
    const evidenceCount = evidences.length;
    const confidence = Number(
      Math.min(1, evidenceCount / Math.max(competency.minEvidencesRequired, 3)).toFixed(3)
    );

    const isMastered =
      evidenceCount >= competency.minEvidencesRequired &&
      masteryScore >= competency.masteryThreshold;

    return {
      masteryScore,
      confidence,
      evidenceCount,
      status: isMastered ? 'mastered' : 'in_progress',
    };
  }

  /**
   * Calcula próximo intervalo de revisão espaçada (SRS simplificado estilo SM-2).
   */
  static computeNextReview(
    score0To100: number,
    previousIntervalDays = 1,
    previousEase = 2.5,
    previousRepetitions = 0,
    now = new Date()
  ): { intervalDays: number; easeFactor: number; repetitions: number; dueAt: string } {
    const passed = score0To100 >= 70;
    let repetitions = passed ? previousRepetitions + 1 : 0;
    let intervalDays = 1;

    if (!passed) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(previousIntervalDays * previousEase);
    }

    const quality = Math.max(0, Math.min(5, Math.round((score0To100 / 100) * 5)));
    const easeFactor = Number(
      Math.max(1.3, previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2)
    );

    const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      intervalDays,
      easeFactor,
      repetitions,
      dueAt: dueDate.toISOString(),
    };
  }

  /**
   * Decide deterministicamente a próxima atividade recomendada para o aluno.
   */
  static recommendNextActivity(params: {
    studentId: string;
    competencies: CompetencyNode[];
    masteryStates: MasteryState[];
    dueReviews: DueReviewItem[];
    now?: Date;
  }): PedagogicalDecision {
    const now = params.now ?? new Date();
    const masteryMap = new Map(params.masteryStates.map((m) => [m.competencyId, m]));
    const compMap = new Map(params.competencies.map((c) => [c.id, c]));

    // 1. Prioridade: Revisões espaçadas vencidas
    const overdue = params.dueReviews
      .filter((r) => new Date(r.dueAt).getTime() <= now.getTime())
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    if (overdue.length > 0) {
      const target = overdue[0];
      const comp = compMap.get(target.competencyId);
      if (comp) {
        return {
          studentId: params.studentId,
          competencyId: comp.id,
          recommendedActivityType: 'review',
          difficulty: this.difficultyForScore(masteryMap.get(comp.id)?.masteryScore ?? 0),
          reason: `Revisão espaçada vencida para consolidar "${comp.title}" (${comp.code}).`,
          prerequisitesSatisfied: this.arePrerequisitesSatisfied(comp, masteryMap),
        };
      }
    }

    // 2. Competências não dominadas com pré-requisitos satisfeitos, ordenadas por nível CEFR
    const available = params.competencies
      .filter((c) => {
        const state = masteryMap.get(c.id);
        return state?.status !== 'mastered' && this.arePrerequisitesSatisfied(c, masteryMap);
      })
      .sort((a, b) => CEFR_ORDER[a.cefrLevel] - CEFR_ORDER[b.cefrLevel]);

    if (available.length > 0) {
      const nextComp = available[0];
      const state = masteryMap.get(nextComp.id);
      const evidenceCount = state?.evidenceCount ?? 0;
      const score = state?.masteryScore ?? 0;

      // Se nunca praticou -> aula de input; se já começou e é interação oral -> diálogo IA; senão -> exercício
      let activityType: ActivityType = 'input_lesson';
      if (evidenceCount === 0) {
        activityType = 'input_lesson';
      } else if (nextComp.skillCategory === 'spoken_interaction' && evidenceCount < nextComp.minEvidencesRequired) {
        activityType = 'ai_dialogue';
      } else {
        activityType = 'exercise';
      }

      return {
        studentId: params.studentId,
        competencyId: nextComp.id,
        recommendedActivityType: activityType,
        difficulty: this.difficultyForScore(score),
        reason:
          evidenceCount === 0
            ? `Próxima competência desbloqueada no nível ${nextComp.cefrLevel}: "${nextComp.title}".`
            : `Continuar prática em "${nextComp.title}" (domínio atual: ${score}%, evidências: ${evidenceCount}/${nextComp.minEvidencesRequired}).`,
        prerequisitesSatisfied: true,
      };
    }

    // 3. Fallback: Todas as competências atuais dominadas
    return {
      studentId: params.studentId,
      competencyId: null,
      recommendedActivityType: 'unit_assessment',
      difficulty: 'intermediate',
      reason: 'Todas as competências disponíveis do módulo atual atingiram o domínio mínimo. Pronto para avaliação.',
      prerequisitesSatisfied: true,
    };
  }

  private static difficultyForScore(score: number): DifficultyLevel {
    if (score < 50) return 'basic';
    if (score < 80) return 'intermediate';
    return 'advanced';
  }
}
