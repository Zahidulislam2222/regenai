/**
 * @regenai/ui — design system barrel.
 *
 * Usage:
 *   import {Button, Card, Dialog, Heart} from '@regenai/ui';
 *   import {colors, radii, shadows, motion} from '@regenai/ui/tokens';
 *
 * Component source: copy-owned (shadcn/ui ownership model) under src/components/ui/.
 * Radix primitives are real deps; we wrap + style with brand tokens.
 */

// Utils
export {cn, focusRing, srOnly} from './lib/utils';

// Components
export * from './components/ui/Accordion';
export * from './components/ui/Badge';
export * from './components/ui/Button';
export * from './components/ui/Card';
export * from './components/ui/Checkbox';
export * from './components/ui/Dialog';
export * from './components/ui/Drawer';
export * from './components/ui/Icon';
export * from './components/ui/Input';
export * from './components/ui/Popover';
export * from './components/ui/Radio';
export * from './components/ui/Select';
export * from './components/ui/Tabs';
export * from './components/ui/Toast';
export * from './components/ui/Tooltip';
