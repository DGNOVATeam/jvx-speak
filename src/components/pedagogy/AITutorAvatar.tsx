import { useState } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AITutorAvatarProps {
  avatarUrl?: string;
  targetLanguage?: 'en' | 'es-ES';
  size?: 'sm' | 'md' | 'lg';
  cefrBadge?: string;
  isSpeaking?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AITutorAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 sm:h-9 sm:w-9',
  md: 'h-12 w-12 sm:h-14 sm:w-14',
  lg: 'h-16 w-16 sm:h-20 sm:w-20',
};

const DEFAULT_TUTOR_AVATAR: Partial<Record<'en' | 'es-ES', string>> = {
  en: '/media/tutors/tutor-english.webp',
};

/**
 * Avatar configurável do Tutor IA com suporte ao asset dedicado por idioma
 * e fallback institucional JVX SPEAK em caso de ausência ou falha de carregamento.
 */
export function AITutorAvatar({
  avatarUrl,
  targetLanguage = 'en',
  size = 'md',
  cefrBadge,
  isSpeaking = false,
  className,
}: AITutorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = avatarUrl ?? DEFAULT_TUTOR_AVATAR[targetLanguage];
  const showImage = Boolean(resolvedSrc && !imgError);

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full overflow-hidden border-2 transition-all shadow-sm',
          SIZE_CLASSES[size],
          isSpeaking
            ? 'border-[var(--jvx-gold)] ring-4 ring-[var(--jvx-gold)]/30'
            : 'border-[var(--jvx-gold)]/70 bg-gradient-to-br from-[#0F2D4A] via-[#16375B] to-[#1F4E79]'
        )}
      >
        {showImage ? (
          <img
            src={resolvedSrc}
            alt="Avatar do Tutor IA"
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.28),transparent_68%)]">
            <Bot
              className={cn(
                'text-[var(--jvx-gold)]',
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
              )}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {cefrBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-[var(--jvx-info)] px-1.5 py-0.5 text-[9px] font-extrabold text-white ring-2 ring-[#07182E]">
          {cefrBadge}
        </span>
      )}
    </div>
  );
}
