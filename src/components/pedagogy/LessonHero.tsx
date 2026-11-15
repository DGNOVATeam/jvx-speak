import { ArrowLeft, Briefcase, Clock, Compass, Globe, MessageSquare, Plane, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentCard, ProgressIndicator, StatusBadge } from '@/components/ui';
import type { LessonHeroProps } from './types';

function ScenarioIcon({ scenarioKey }: { scenarioKey: LessonHeroProps['media']['scenarioKey'] }) {
  switch (scenarioKey) {
    case 'business_intro':
      return <Briefcase className="h-7 w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'travel_airport':
      return <Plane className="h-7 w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'written_communication':
      return <MessageSquare className="h-7 w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'past_events':
      return <Compass className="h-7 w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    default:
      return <Globe className="h-7 w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
  }
}

export interface ExtendedLessonHeroProps extends LessonHeroProps {
  objective?: string;
  progressPct?: number | null;
  progressLabel?: string;
}

/**
 * Cabeçalho contextual da lição JVX SPEAK 2.0.
 * Exibe idioma, nível CEFR, unidade, título, objetivo e imagem/fallback do cenário.
 */
export function LessonHero({
  title,
  unitTitle,
  cefrLevel,
  targetLanguage,
  media,
  estimatedMinutes,
  objective,
  progressPct,
  progressLabel,
}: ExtendedLessonHeroProps) {
  const langLabel = targetLanguage === 'es-ES' ? 'Espanhol (Cervantes)' : 'Inglês (CEFR)';

  return (
    <ContentCard
      variant="elevated"
      padding="none"
      className="overflow-hidden border-[var(--jvx-border-subtle)]"
    >
      <div
        className={`relative bg-gradient-to-br ${media.fallbackGradient} p-4 sm:p-6 text-[var(--jvx-text-primary)]`}
      >
        {/* Breadcrumb + Metadados */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-[var(--jvx-text-secondary)] min-w-0">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-[var(--jvx-text-primary)] transition shrink-0"
              aria-label="Voltar para Cursos"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="truncate">
              Cursos <span aria-hidden="true">›</span> {langLabel}{' '}
              {unitTitle ? (
                <>
                  <span aria-hidden="true">›</span> {unitTitle}
                </>
              ) : null}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="info" label={langLabel} />
            {typeof estimatedMinutes === 'number' && estimatedMinutes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--jvx-text-secondary)]">
                <Clock className="h-3 w-3 text-[var(--jvx-gold)]" aria-hidden="true" />
                {estimatedMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Título + Mídia do Cenário */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center rounded-lg bg-[var(--jvx-info)] px-2.5 py-1 text-xs font-extrabold text-white shadow-sm shrink-0">
                {cefrLevel}
              </span>
              <h1 className="jvx-heading text-lg sm:text-2xl font-bold text-[var(--jvx-text-primary)] leading-snug">
                {title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--jvx-text-secondary)]">
              {media.scenarioLabel}
            </p>
          </div>

          {media.heroImageUrl ? (
            <img
              src={media.heroImageUrl}
              alt={media.altText}
              loading="lazy"
              className="hidden sm:block h-16 w-24 rounded-xl object-cover border border-[var(--jvx-border-gold)] shrink-0"
            />
          ) : (
            <div
              role="img"
              aria-label={media.altText}
              className="hidden sm:flex h-14 w-14 rounded-2xl border border-[var(--jvx-border-gold)] bg-[var(--jvx-bg)]/70 items-center justify-center shrink-0"
            >
              <ScenarioIcon scenarioKey={media.scenarioKey} />
            </div>
          )}
        </div>

        {/* Barra de Progresso Real (exibida apenas quando há dado real disponível) */}
        {typeof progressPct === 'number' && progressPct > 0 && (
          <div className="mt-4">
            <ProgressIndicator
              value={progressPct}
              label={progressLabel || 'Domínio atual desta competência'}
              tone="success"
              size="sm"
            />
          </div>
        )}

        {/* Card de Objetivo Pedagógico com destaque Dourado */}
        {objective && (
          <div className="mt-4 rounded-xl border border-[var(--jvx-border-gold)] bg-[var(--jvx-bg)]/65 px-3.5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-bold text-[var(--jvx-gold)] flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Objetivo da lição
              </p>
              <p className="text-xs sm:text-sm text-[var(--jvx-text-primary)] leading-relaxed">
                {objective}
              </p>
            </div>
            <div className="sm:hidden h-11 w-11 rounded-xl border border-[var(--jvx-border-gold)] bg-[var(--jvx-surface-card)] flex items-center justify-center shrink-0">
              <ScenarioIcon scenarioKey={media.scenarioKey} />
            </div>
          </div>
        )}
      </div>
    </ContentCard>
  );
}
