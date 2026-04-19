/**
 * Typed design-token surface for RegenAI.
 *
 * Mirrors docs/design-system/brand-tokens.json + app/styles/tailwind.css so
 * TypeScript components can reference tokens by name rather than hardcoding
 * colors. When a token is added to brand-tokens.json, reflect it here and in
 * tailwind.css (three places — intentional; no build-time generator yet).
 *
 * Usage:
 *   import {colors, radii} from '~/lib/tokens';
 *   const style = {backgroundColor: colors.bone, borderRadius: radii.md};
 *
 * Tailwind utility classes (preferred): bg-bone, text-primary, rounded-md.
 * Token constants (when dynamic / inline required): via this module.
 */

export const colors = {
  // Brand
  bone: 'var(--color-bone)',
  boneMuted: 'var(--color-bone-muted)',
  boneSubtle: 'var(--color-bone-subtle)',
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primaryActive: 'var(--color-primary-active)',
  accent: 'var(--color-accent)',
  accentHover: 'var(--color-accent-hover)',
  sage: 'var(--color-sage)',
  sageHover: 'var(--color-sage-hover)',
  ink: 'var(--color-ink)',
  muted: 'var(--color-muted)',
  subtle: 'var(--color-subtle)',

  // Status
  success: 'var(--color-success)',
  successBg: 'var(--color-success-bg)',
  warning: 'var(--color-warning)',
  warningBg: 'var(--color-warning-bg)',
  error: 'var(--color-error)',
  errorBg: 'var(--color-error-bg)',
  info: 'var(--color-info)',
  infoBg: 'var(--color-info-bg)',

  // Surface
  surfacePage: 'var(--surface-page)',
  surfaceCard: 'var(--surface-card)',
  surfaceElevated: 'var(--surface-elevated)',
  overlay: 'var(--color-overlay)',

  // Border
  borderDefault: 'var(--color-border-default)',
  borderStrong: 'var(--color-border-strong)',
  borderFocus: 'var(--color-border-focus)',
  borderError: 'var(--color-border-error)',

  // Semantic text
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textSubtle: 'var(--text-subtle)',
  textInverse: 'var(--text-inverse)',
} as const;

export const fonts = {
  display: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono)',
  arabic: 'var(--font-arabic)',
} as const;

export const radii = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  '3xl': 'var(--radius-3xl)',
  full: '9999px',
} as const;

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
} as const;

export const motion = {
  easeIn: 'var(--ease-in)',
  easeOut: 'var(--ease-out)',
  easeInOut: 'var(--ease-in-out)',
  springGentle: 'var(--ease-spring-gentle)',
  springBouncy: 'var(--ease-spring-bouncy)',
} as const;

export type ThemeMode = 'light' | 'dark' | 'hc' | 'system';
