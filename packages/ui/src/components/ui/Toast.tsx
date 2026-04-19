import * as ToastPrimitive from '@radix-ui/react-toast';
import {X} from 'lucide-react';
import {forwardRef, type ComponentPropsWithoutRef, type ElementRef} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, focusRing} from '../../lib/utils';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({className, ...props}, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[1700] flex max-h-screen w-full flex-col-reverse p-4 gap-2',
      'sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-sm',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  cn(
    'pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-md border p-4 pr-6 shadow-[var(--shadow-lg)] transition-all',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
  ),
  {
    variants: {
      variant: {
        default: 'border-[var(--color-border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)]',
        success: 'border-[var(--color-success)] bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning: 'border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        error: 'border-[var(--color-error)] bg-[var(--color-error-bg)] text-[var(--color-error)]',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

export interface ToastProps
  extends ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

export const Toast = forwardRef<
  ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({className, variant, ...props}, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({variant}), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({className, ...props}, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({className, ...props}, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({className, ...props}, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    toast-close=""
    className={cn('absolute right-2 top-2 rounded-sm opacity-70 hover:opacity-100', focusRing, className)}
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">Close</span>
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;
