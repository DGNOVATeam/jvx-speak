import { Briefcase, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LessonStepperProps } from './types';

export interface ExtendedLessonStepperProps extends LessonStepperProps {
  scenarioLabel?: string;
  onChangeScenario?: () => void;
}

/**
 * Stepper horizontal de 4 etapas conectado por linha de progresso,
 * adaptado para desktop (1440px), tablet (768px) e mobile (320px/390px).
 */
export function LessonStepper({
  steps,
  currentStep,
  onSelectStep,
  scenarioLabel,
  onChangeScenario,
}: ExtendedLessonStepperProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-white dark:bg-[var(--jvx-surface-card)] p-3 sm:p-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <nav aria-label="Etapas da lição" className="w-full lg:flex-1 min-w-0">
          <ol className="relative grid grid-cols-4 items-start gap-1 sm:gap-2">
            {steps.map((item, idx) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <li key={item.step} className="relative flex flex-col items-center text-center min-w-0">
                  {/* Linha conectora horizontal entre os círculos */}
                  {idx < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-4 left-[50%] w-full h-0.5 pointer-events-none z-0 transition-colors',
                        isCompleted
                          ? 'bg-[var(--jvx-success)]'
                          : 'bg-slate-200 dark:bg-white/15'
                      )}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectStep(item.step)}
                    aria-current={isActive ? 'step' : undefined}
                    className="group relative z-10 flex flex-col items-center gap-1.5 min-h-[44px] w-full px-0.5 sm:px-1 cursor-pointer focus-visible:rounded-xl"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition shadow-sm',
                        isActive
                          ? 'bg-[var(--jvx-gold)] text-[var(--jvx-navy)] ring-4 ring-[var(--jvx-gold)]/25'
                          : isCompleted
                            ? 'bg-[var(--jvx-success)] text-[var(--jvx-navy)]'
                            : 'border border-slate-300 dark:border-[var(--jvx-border-subtle)] bg-slate-100 dark:bg-[var(--jvx-bg)] text-slate-600 dark:text-[var(--jvx-text-secondary)] group-hover:border-[var(--jvx-gold)]'
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4 stroke-[2.75]" aria-hidden="true" /> : item.step}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2',
                        isActive
                          ? 'text-[#9A7B16] dark:text-[var(--jvx-gold)]'
                          : isCompleted
                            ? 'text-[#0F8B6D] dark:text-[var(--jvx-success)]'
                            : 'text-slate-500 dark:text-[var(--jvx-text-secondary)]'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {scenarioLabel && onChangeScenario && (
          <button
            type="button"
            onClick={onChangeScenario}
            title="Trocar cenário de prática"
            className="inline-flex items-center justify-center gap-2 self-stretch sm:self-center lg:self-auto rounded-xl border border-slate-200 dark:border-[var(--jvx-border-subtle)] bg-slate-50 dark:bg-[var(--jvx-bg)]/90 px-3 py-2 min-h-[40px] text-xs font-medium text-slate-700 dark:text-[var(--jvx-text-secondary)] hover:border-[var(--jvx-gold)] hover:text-[var(--jvx-gold)] transition shrink-0 cursor-pointer"
          >
            <Briefcase className="h-3.5 w-3.5 text-[var(--jvx-gold)] shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[230px] sm:max-w-[260px] lg:max-w-[240px]">
              Cenário: {scenarioLabel}
            </span>
            <RefreshCw className="h-3 w-3 opacity-70 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
