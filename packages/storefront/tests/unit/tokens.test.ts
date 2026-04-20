/**
 * Smoke test: design tokens module exports the expected shape.
 * This is the minimum test so Vitest has something real to run before
 * Day 4+ tests land. Coverage threshold is 40% initially, rising to 70% by Day 10.
 */

import {describe, it, expect} from 'vitest';
import {colors, fonts, radii, shadows, motion} from '~/lib/tokens';

describe('design tokens', () => {
  it('exports full color palette', () => {
    expect(colors.bone).toBe('var(--color-bone)');
    expect(colors.primary).toBe('var(--color-primary)');
    expect(colors.accent).toBe('var(--color-accent)');
    expect(colors.sage).toBe('var(--color-sage)');
  });

  it('exports status colors', () => {
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
    expect(colors.info).toBeDefined();
  });

  it('exports typography token references', () => {
    expect(fonts.display).toBe('var(--font-display)');
    expect(fonts.body).toBe('var(--font-body)');
    expect(fonts.mono).toBe('var(--font-mono)');
    expect(fonts.arabic).toBe('var(--font-arabic)');
  });

  it('exports radii + shadows + motion', () => {
    expect(radii.md).toBe('var(--radius-md)');
    expect(shadows.lg).toBe('var(--shadow-lg)');
    expect(motion.springGentle).toBe('var(--ease-spring-gentle)');
  });
});
