import {cva, type VariantProps} from 'class-variance-authority';
import {forwardRef, type HTMLAttributes} from 'react';
import {cn} from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-primary)] text-[var(--text-inverse)]',
        accent: 'bg-[var(--color-accent)] text-[var(--text-inverse)]',
        sage: 'bg-[var(--color-sage)] text-[var(--text-inverse)]',
        outline: 'border border-[var(--color-border-strong)] text-[var(--text-primary)]',
        success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
      },
    },
    defaultVariants: {variant: 'primary'},
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({className, variant, ...props}, ref) => (
    <span ref={ref} className={cn(badgeVariants({variant}), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
