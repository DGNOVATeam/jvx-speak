import type { LessonMediaAsset } from '@/lib/pedagogicalMedia';
import type { GrammarRule, WordItem } from '@/features/curriculum/lessonPedagogy';

/**
 * Contratos públicos dos componentes pedagógicos planejados para as Fases 2 e 3.
 * Mantidos desacoplados da implementação visual das telas atuais.
 */
export interface LessonHeroProps {
  title: string;
  unitTitle?: string;
  cefrLevel: string;
  targetLanguage: 'en' | 'es-ES';
  media: LessonMediaAsset;
  estimatedMinutes?: number;
}

export interface LessonStepperItem {
  step: 1 | 2 | 3 | 4;
  label: string;
}

export interface LessonStepperProps {
  steps: LessonStepperItem[];
  currentStep: 1 | 2 | 3 | 4;
  onSelectStep: (step: 1 | 2 | 3 | 4) => void;
}

export interface AudioPhraseCardProps {
  phrase: string;
  translation: string;
  isPlaying?: boolean;
  onPlay: (text: string) => void;
}

export interface VocabularyPanelProps {
  items: WordItem[];
  playingText: string | null;
  onInsertWord: (word: string) => void;
  onPlay: (text: string) => void;
  onOpenGlossary: () => void;
}

export interface GrammarCardProps {
  rule: GrammarRule;
  isPlaying?: boolean;
  onPlay: (text: string) => void;
}
