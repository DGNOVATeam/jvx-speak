import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface JvxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<JvxButtonProps['size']>, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs',
  md: 'min-h-[44px] px-4 py-2.5 text-sm',
  lg: 'min-h-[48px] px-5 py-3 text-sm sm:text-base',
};

/**
 * Botão institucional primário (Dourado JVX) com alvo de toque acessível (>= 44px no padrão).
 */
export function PrimaryButton({
  children,
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: JvxButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'jvx-btn-primary inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Botão institucional secundário (borda Dourada JVX).
 */
export function SecondaryButton({
  children,
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...props
}: JvxButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'jvx-btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
