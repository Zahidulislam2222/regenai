import * as DialogPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {forwardRef, type ComponentPropsWithoutRef, type ElementRef} from 'react';
import {cn, focusRing} from '../../lib/utils';

/**
 * Side drawer — Radix Dialog primitive with slide-from-edge styling.
 * Usage: <Drawer><DrawerTrigger>…<DrawerContent side="right">…</DrawerContent></Drawer>
 */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

type Side = 'top' | 'bottom' | 'left' | 'right';

const sideClasses: Record<Side, string> = {
  top: 'inset-x-0 top-0 border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
  bottom: 'inset-x-0 bottom-0 border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  right: 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
};

export interface DrawerContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: Side;
}

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({side = 'right', className, children, ...props}, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 border-[var(--color-border-default)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-xl)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'transition-transform duration-300',
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className={cn('absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100', focusRing)}>
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = 'DrawerContent';
