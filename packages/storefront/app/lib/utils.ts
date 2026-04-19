/**
 * Tailwind / class-composition utilities.
 *
 * - cn(): merges Tailwind classes intelligently (resolves conflicts, drops
 *   duplicates). Usage: cn('px-4 py-2', isLarge && 'text-lg', className)
 * - focusRing: standard WCAG 2.2 AA focus-visible styles reused across
 *   interactive components.
 * - srOnly: screen-reader-only utility class fragment (Tailwind sr-only
 *   works too; this is for components that can't add classes).
 */

import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone';

export const srOnly =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Assert a value is defined. Throws if not — used at module boundaries
 * where TypeScript can't infer non-nullability from env vars / metafields.
 */
export function assertDefined<T>(
  value: T | null | undefined,
  label: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${label} to be defined, got ${value}`);
  }
  return value;
}
