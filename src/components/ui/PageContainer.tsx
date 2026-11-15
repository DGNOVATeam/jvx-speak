import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const MAX_WIDTH_MAP: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-full',
};

/**
 * Container responsivo mobile-first (320px a 1440px+) com prevenção de overflow horizontal.
 */
export function PageContainer({
  children,
  maxWidth = 'xl',
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0 mx-auto space-y-5 sm:space-y-6 jvx-safe-bottom',
        MAX_WIDTH_MAP[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
