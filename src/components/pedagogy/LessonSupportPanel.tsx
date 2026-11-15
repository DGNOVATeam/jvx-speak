import { useState } from 'react';
import { Blocks, BookOpen, ChevronDown, GraduationCap, Headphones } from 'lucide-react';
import { ContentCard } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { GrammarRule, WordItem } from '@/features/curriculum/lessonPedagogy';
import { AudioPhraseCard } from './AudioPhraseCard';
import { GrammarCard } from './GrammarCard';
import { VocabularyPanel } from './VocabularyPanel';

export type SupportTab = 'chunks' | 'vocabulary' | 'grammar';

export interface LessonSupportChunk {
  chunk: string;
  pt: string;
}

export interface LessonSupportPanelProps {
  chunks: LessonSupportChunk[];
  wordBank: WordItem[];
  grammarRules: GrammarRule[];
  playingText: string | null;
  onPlay: (text: string) => void;
  onInsertWord: (word: string) => void;
  onOpenGlossary: () => void;
  onOpenGrammarModal: () => void;
  collapsibleOnMobile?: boolean;
  defaultMobileExpanded?: boolean;
}

/**
 * Painel reutilizável de Material de Apoio (Chunks, Vocabulário, Regras e Glossário).
 * No desktop permanece aberto com abas acessíveis; no mobile pode atuar como
 * seção expansível abaixo do exercício principal.
 */
export function LessonSupportPanel({
  chunks,
  wordBank,
  grammarRules,
  playingText,
  onPlay,
  onInsertWord,
  onOpenGlossary,
  onOpenGrammarModal,
  collapsibleOnMobile = false,
  defaultMobileExpanded = false,
}: LessonSupportPanelProps) {
  const [activeTab, setActiveTab] = useState<SupportTab>('chunks');
  const [mobileExpanded, setMobileExpanded] = useState(defaultMobileExpanded);

  const tabs: { id: SupportTab; label: string; icon: typeof Headphones }[] = [
    { id: 'chunks', label: 'Chunks', icon: Headphones },
    { id: 'vocabulary', label: 'Vocabulário', icon: Blocks },
    { id: 'grammar', label: 'Regras', icon: GraduationCap },
  ];

  return (
    <ContentCard variant="default" padding="none" className="overflow-hidden">
      {/* Cabeçalho: interativo no mobile quando collapsibleOnMobile=true, estático no desktop */}
      {collapsibleOnMobile ? (
        <>
          <button
            type="button"
            onClick={() => setMobileExpanded((prev) => !prev)}
            aria-expanded={mobileExpanded}
            className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3.5 min-h-[52px] text-left hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <span className="jvx-heading text-sm font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
              <span>Material de Apoio</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-[var(--jvx-text-secondary)]">
                ({chunks.length} chunks • {wordBank.length} termos)
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-500 dark:text-[var(--jvx-text-secondary)] transition-transform duration-200 shrink-0',
                mobileExpanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          <div className="hidden lg:flex items-center justify-between gap-2 px-5 pt-5 pb-3">
            <h2 className="jvx-heading text-base font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
              Material de Apoio
            </h2>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <h2 className="jvx-heading text-sm sm:text-base font-bold text-[#0B1F3B] dark:text-[var(--jvx-text-primary)] flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
            Material de Apoio
          </h2>
        </div>
      )}

      {/* Corpo do painel: sempre visível em lg+, expansível no mobile */}
      <div
        className={cn(
          'px-4 sm:px-5 pb-4 sm:pb-5 space-y-4',
          collapsibleOnMobile && (mobileExpanded ? 'block pt-1' : 'hidden lg:block')
        )}
      >
        {/* Abas segmentadas acessíveis */}
        <div
          role="tablist"
          aria-label="Seções do material de apoio"
          className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-100 dark:bg-[var(--jvx-bg)]/90 p-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`support-tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`support-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 min-h-[38px] text-xs font-semibold transition cursor-pointer min-w-0',
                  isSelected
                    ? 'bg-white dark:bg-[var(--jvx-surface-elevated)] text-[#0B1F3B] dark:text-[var(--jvx-gold)] border border-[var(--jvx-gold)]/60 shadow-sm'
                    : 'text-slate-600 dark:text-[var(--jvx-text-secondary)] hover:text-slate-900 dark:hover:text-[var(--jvx-text-primary)]'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Painel 1: Chunks Estruturais */}
        {activeTab === 'chunks' && (
          <div
            role="tabpanel"
            id="support-panel-chunks"
            aria-labelledby="support-tab-chunks"
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-[var(--jvx-text-primary)]">
                Chunks Estruturais <span className="font-normal text-slate-500 dark:text-[var(--jvx-text-secondary)]">(Ouça e repita)</span>
              </p>
              <span className="text-[11px] font-medium text-slate-500 dark:text-[var(--jvx-text-secondary)]">
                {chunks.length} frases
              </span>
            </div>

            <div className="space-y-2.5 lg:max-h-[420px] lg:overflow-y-auto lg:pr-1">
              {chunks.map((c) => (
                <AudioPhraseCard
                  key={c.chunk}
                  phrase={c.chunk}
                  translation={c.pt}
                  isPlaying={playingText === c.chunk}
                  onPlay={onPlay}
                />
              ))}
            </div>
          </div>
        )}

        {/* Painel 2: Vocabulário + Glossário */}
        {activeTab === 'vocabulary' && (
          <div
            role="tabpanel"
            id="support-panel-vocabulary"
            aria-labelledby="support-tab-vocabulary"
            className="space-y-3"
          >
            <VocabularyPanel
              items={wordBank}
              playingText={playingText}
              onInsertWord={onInsertWord}
              onPlay={onPlay}
              onOpenGlossary={onOpenGlossary}
            />
          </div>
        )}

        {/* Painel 3: Regras Gramaticais */}
        {activeTab === 'grammar' && (
          <div
            role="tabpanel"
            id="support-panel-grammar"
            aria-labelledby="support-tab-grammar"
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-[var(--jvx-text-primary)]">
                Regras Gramaticais ({grammarRules.length})
              </p>
              <button
                type="button"
                onClick={onOpenGrammarModal}
                className="text-xs font-semibold text-[var(--jvx-info)] hover:underline cursor-pointer"
              >
                Expandir regras
              </button>
            </div>
            <div className="space-y-3 lg:max-h-[420px] lg:overflow-y-auto lg:pr-1">
              {grammarRules.map((rule) => (
                <GrammarCard
                  key={rule.title}
                  rule={rule}
                  isPlaying={playingText === rule.audioExample}
                  onPlay={onPlay}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ContentCard>
  );
}
