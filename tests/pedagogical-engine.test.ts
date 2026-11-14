import { describe, it, expect } from 'vitest';
import {
  PedagogicalEngine,
  type CompetencyNode,
  type MasteryState,
} from '../supabase/functions/_shared/pedagogy/engine';

const COMP_A1_GREET: CompetencyNode = {
  id: 'c1',
  code: 'A1.SI.GREETINGS',
  cefrLevel: 'A1',
  skillCategory: 'spoken_interaction',
  title: 'Apresentações',
  masteryThreshold: 75,
  minEvidencesRequired: 3,
  prerequisiteIds: [],
};

const COMP_A2_WORK: CompetencyNode = {
  id: 'c2',
  code: 'A2.SI.WORK_TASKS',
  cefrLevel: 'A2',
  skillCategory: 'spoken_interaction',
  title: 'Trabalho',
  masteryThreshold: 75,
  minEvidencesRequired: 3,
  prerequisiteIds: ['c1'],
};

describe('PedagogicalEngine', () => {
  it('não considera competência dominada com apenas 1 exercício correto', () => {
    const result = PedagogicalEngine.computeMasteryUpdate(COMP_A1_GREET, [
      { score0To100: 100, weight: 1, createdAt: '2026-11-14T10:00:00Z' },
    ]);

    expect(result.evidenceCount).toBe(1);
    expect(result.masteryScore).toBe(100);
    expect(result.status).toBe('in_progress');
    expect(result.confidence).toBeLessThan(1);
  });

  it('marca como mastered após atingir minEvidencesRequired e threshold', () => {
    const result = PedagogicalEngine.computeMasteryUpdate(COMP_A1_GREET, [
      { score0To100: 70, weight: 1, createdAt: '2026-11-12T10:00:00Z' },
      { score0To100: 80, weight: 1, createdAt: '2026-11-13T10:00:00Z' },
      { score0To100: 90, weight: 1, createdAt: '2026-11-14T10:00:00Z' },
    ]);

    expect(result.evidenceCount).toBe(3);
    expect(result.masteryScore).toBeGreaterThanOrEqual(75);
    expect(result.status).toBe('mastered');
    expect(result.confidence).toBe(1);
  });

  it('bloqueia competência A2 se pré-requisito A1 não foi dominado', () => {
    const masteryMap = new Map<string, MasteryState>([
      ['c1', { competencyId: 'c1', masteryScore: 60, confidence: 0.33, evidenceCount: 1, status: 'in_progress' }],
    ]);

    expect(PedagogicalEngine.arePrerequisitesSatisfied(COMP_A2_WORK, masteryMap)).toBe(false);
  });

  it('prioriza revisão espaçada vencida antes de nova competência', () => {
    const decision = PedagogicalEngine.recommendNextActivity({
      studentId: 'u1',
      competencies: [COMP_A1_GREET, COMP_A2_WORK],
      masteryStates: [
        { competencyId: 'c1', masteryScore: 85, confidence: 1, evidenceCount: 3, status: 'mastered' },
      ],
      dueReviews: [
        { competencyId: 'c1', dueAt: '2026-11-13T10:00:00Z', repetitions: 1 },
      ],
      now: new Date('2026-11-14T12:00:00Z'),
    });

    expect(decision.competencyId).toBe('c1');
    expect(decision.recommendedActivityType).toBe('review');
  });

  it('recomenda próxima competência desbloqueada quando não há revisões vencidas', () => {
    const decision = PedagogicalEngine.recommendNextActivity({
      studentId: 'u1',
      competencies: [COMP_A1_GREET, COMP_A2_WORK],
      masteryStates: [
        { competencyId: 'c1', masteryScore: 85, confidence: 1, evidenceCount: 3, status: 'mastered' },
      ],
      dueReviews: [],
    });

    expect(decision.competencyId).toBe('c2');
    expect(decision.recommendedActivityType).toBe('input_lesson');
    expect(decision.prerequisitesSatisfied).toBe(true);
  });
});
