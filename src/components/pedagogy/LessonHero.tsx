import { useState } from 'react';
import { ArrowLeft, Briefcase, Clock, Compass, Globe, MessageSquare, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentCard, ProgressIndicator, StatusBadge } from '@/components/ui';
import type { LessonHeroProps } from './types';

function ScenarioIcon({ scenarioKey }: { scenarioKey: LessonHeroProps['media']['scenarioKey'] }) {
  switch (scenarioKey) {
    case 'business_intro':
      return <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'travel_airport':
      return <Plane className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'written_communication':
      return <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    case 'past_events':
      return <Compass className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
    default:
      return <Globe className="h-6 w-6 sm:h-7 sm:w-7 text-[var(--jvx-gold)]" aria-hidden="true" />;
  }
}

export interface ExtendedLessonHeroProps extends LessonHeroProps {
  objective?: string;
  progressPct?: number | null;
  progressLabel?: string;
}

/**
 * Cabeçalho contextual da lição JVX SPEAK 2.0.
 * Exibe breadcrumb, idioma, nível CEFR, título, objetivo curto e mídia/fallback do cenário.
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
  const subtitleText = objective || media.scenarioLabel;
  const [imgError, setImgError] = useState(false);
  const showHeroImage = Boolean(media.heroImageUrl && !imgError);

  return (
    <ContentCard
      variant="elevated"
      padding="none"
      className="overflow-hidden border-[var(--jvx-border-subtle)]"
    >
      <div
        className={`relative bg-gradient-to-br ${media.fallbackGradient} text-[var(--jvx-text-primary)]`}
      >
        {/* Imagem contextual opcional à direita com transição suave em gradiente */}
        {showHeroImage && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-44 sm:w-72 md:w-80 lg:w-96 overflow-hidden"
          >
            <img
              src={media.heroImageUrl}
              alt=""
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-center opacity-55 sm:opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07182E] via-[#07182E]/85 sm:via-[#07182E]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07182E]/85 via-transparent to-[#07182E]/35" />
          </div>
        )}

        <div className="relative z-10 p-4 sm:p-6">
          {/* Breadcrumb + Metadados */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-[var(--jvx-text-secondary)] min-w-0 flex-1">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-[var(--jvx-text-primary)] transition shrink-0"
                aria-label="Voltar para Cursos"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <nav aria-label="Breadcrumb" className="truncate">
                <span>Cursos</span>
                <span aria-hidden="true" className="mx-1.5 text-white/40">›</span>
                <span>{langLabel}</span>
                {unitTitle ? (
                  <>
                    <span aria-hidden="true" className="mx-1.5 text-white/40">›</span>
                    <span>{unitTitle}</span>
                  </>
                ) : null}
                <span aria-hidden="true" className="hidden md:inline mx-1.5 text-white/40">›</span>
                <span className="hidden md:inline text-[var(--jvx-text-primary)] font-medium">
                  {title}
                </span>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <StatusBadge tone="info" label={langLabel} />
              {typeof estimatedMinutes === 'number' && estimatedMinutes > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--jvx-text-secondary)]">
                  <Clock className="h-3 w-3 text-[var(--jvx-gold)]" aria-hidden="true" />
                  {estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          {/* Título + Descrição curta + Fallback institucional quando não há heroImageUrl */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2 max-w-2xl">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="inline-flex items-center justify-center rounded-lg bg-[var(--jvx-info)] px-2.5 py-1 text-xs font-extrabold text-white shadow-sm shrink-0 mt-0.5 sm:mt-0">
                  {cefrLevel}
                </span>
                <h1 className="jvx-heading text-lg sm:text-2xl font-bold text-[var(--jvx-text-primary)] leading-snug">
                  {title}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-[var(--jvx-text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-none">
                {subtitleText}
              </p>
            </div>

            {!showHeroImage && (
              <div
                role="img"
                aria-label={media.altText}
                className="relative flex h-12 w-12 sm:h-16 sm:w-16 rounded-2xl border border-[var(--jvx-border-gold)] bg-[#07182E]/75 items-center justify-center shrink-0 shadow-inner"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.22),transparent_65%)]"
                />
                <ScenarioIcon scenarioKey={media.scenarioKey} />
              </div>
            )}
          </div>

          {/* Barra de Progresso Real (exibida apenas quando há dado real disponível) */}
          {typeof progressPct === 'number' && progressPct > 0 && (
            <div className="mt-4 max-w-2xl">
              <ProgressIndicator
                value={progressPct}
                label={progressLabel || 'Domínio atual desta competência'}
                tone="success"
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
