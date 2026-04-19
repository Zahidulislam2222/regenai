import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {cn, focusRing} from '../../lib/utils';

export const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--text-inverse)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
        accent:
          'bg-[var(--color-accent)] text-[var(--text-inverse)] hover:bg-[var(--color-accent-hover)]',
        sage:
          'bg-[var(--color-sage)] text-[var(--text-inverse)] hover:bg-[var(--color-sage-hover)]',
        outline:
          'border border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-bone-muted)] text-[var(--text-primary)]',
        ghost:
          'bg-transparent hover:bg-[var(--color-bone-muted)] text-[var(--text-primary)]',
        link:
          'bg-transparent underline-offset-4 hover:underline text-[var(--color-primary)] h-auto p-0',
        danger:
          'bg-[var(--color-error)] text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
      fullWidth: {true: 'w-full'},
    },
    defaultVariants: {variant: 'primary', size: 'md'},
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant, size, fullWidth, asChild = false, loading, disabled, children, ...props}, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({variant, size, fullWidth}), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            <span className="sr-only">Loading…</span>
          </>
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
