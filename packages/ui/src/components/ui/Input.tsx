import {forwardRef, type InputHTMLAttributes} from 'react';
import {cn, focusRing} from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className, type = 'text', error, ...props}, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={error || undefined}
      className={cn(
        'flex h-10 w-full rounded-md border bg-[var(--surface-card)] px-3 py-2 text-sm',
        'placeholder:text-[var(--text-subtle)] disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        error
          ? 'border-[var(--color-border-error)]'
          : 'border-[var(--color-border-default)]',
        focusRing,
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
