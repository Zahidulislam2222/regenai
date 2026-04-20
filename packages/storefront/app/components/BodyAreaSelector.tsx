import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {useSearchParams} from 'react-router';
import {cn} from '~/lib/utils';

/**
 * BodyAreaSelector — interactive SVG body-area filter.
 *
 * Eight clickable regions mapped to the BodyArea metaobject handles:
 *   neck, shoulders, back, knees, hips, ankles, wrists, core
 *
 * State source of truth is the URL searchparam `body` (SSR-readable, shareable,
 * browser-back-compatible). Multi-select is supported (comma-separated).
 *
 * A11y: role=radiogroup when single-select mode, role=group + role=checkbox
 * when multi-select. Arrow keys move focus between regions; Enter/Space
 * toggles. An aria-live region announces the current selection.
 * Each hit region is sized ≥ 24px per WCAG 2.2 target-size.
 */

export const BODY_AREAS = [
  'neck',
  'shoulders',
  'back',
  'knees',
  'hips',
  'ankles',
  'wrists',
  'core',
] as const;
export type BodyArea = (typeof BODY_AREAS)[number];

const LABELS: Record<BodyArea, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  back: 'Back',
  knees: 'Knees',
  hips: 'Hips',
  ankles: 'Ankles',
  wrists: 'Wrists',
  core: 'Core',
};

// Front / back face + cx / cy / r in a 200x400 viewBox (front panel left,
// back panel right).  Radius 18 gives a 36px target at render scale — well
// over the WCAG 2.2 24px floor even at 50% viewport zoom-out.
type Hit = {cx: number; cy: number; r: number; panel: 'front' | 'back'};
const HITS: Record<BodyArea, Hit> = {
  neck:      {cx: 100, cy: 78,  r: 14, panel: 'front'},
  shoulders: {cx: 100, cy: 108, r: 22, panel: 'front'},
  core:      {cx: 100, cy: 168, r: 20, panel: 'front'},
  hips:      {cx: 100, cy: 214, r: 18, panel: 'front'},
  knees:     {cx: 100, cy: 286, r: 16, panel: 'front'},
  ankles:    {cx: 100, cy: 358, r: 14, panel: 'front'},
  wrists:    {cx: 300, cy: 228, r: 14, panel: 'back'},
  back:      {cx: 300, cy: 162, r: 24, panel: 'back'},
};

const READING_ORDER: readonly BodyArea[] = [
  'neck', 'shoulders', 'back', 'core', 'hips', 'wrists', 'knees', 'ankles',
];

export interface BodyAreaSelectorProps {
  /** If true, multiple areas can be selected. Default: true. */
  multi?: boolean;
  /** Override the URL searchparam key. Default: "body". */
  paramKey?: string;
  /** Optional callback fired alongside the URL update. */
  onChange?: (selection: readonly BodyArea[]) => void;
  className?: string;
}

function parseParam(raw: string | null, multi: boolean): BodyArea[] {
  if (!raw) return [];
  const parts = multi ? raw.split(',') : [raw];
  return parts
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is BodyArea => (BODY_AREAS as readonly string[]).includes(p));
}

export function BodyAreaSelector({
  multi = true,
  paramKey = 'body',
  onChange,
  className,
}: BodyAreaSelectorProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(paramKey);
  const [selected, setSelected] = useState<readonly BodyArea[]>(() =>
    parseParam(raw, multi),
  );
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [announce, setAnnounce] = useState<string>('');
  const liveId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep local state in sync with URL (SSR-safe).
  useEffect(() => {
    const next = parseParam(raw, multi);
    setSelected((prev) => (prev.join(',') === next.join(',') ? prev : next));
  }, [raw, multi]);

  const pushToUrl = useCallback(
    (next: readonly BodyArea[]) => {
      setSearchParams(
        (curr) => {
          const copy = new URLSearchParams(curr);
          if (next.length === 0) copy.delete(paramKey);
          else copy.set(paramKey, next.join(','));
          return copy;
        },
        {preventScrollReset: true, replace: true},
      );
      onChange?.(next);
    },
    [setSearchParams, paramKey, onChange],
  );

  const toggle = useCallback(
    (area: BodyArea) => {
      const already = selected.includes(area);
      let next: readonly BodyArea[];
      if (multi) {
        next = already ? selected.filter((a) => a !== area) : [...selected, area];
      } else {
        next = already ? [] : [area];
      }
      setSelected(next);
      pushToUrl(next);
      setAnnounce(
        next.length === 0
          ? 'No body area selected'
          : `Selected: ${next.map((a) => LABELS[a]).join(', ')}`,
      );
    },
    [selected, multi, pushToUrl],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => (i + 1) % READING_ORDER.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => (i - 1 + READING_ORDER.length) % READING_ORDER.length);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusIndex(READING_ORDER.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(READING_ORDER[focusIndex]);
      }
    },
    [focusIndex, toggle],
  );

  // Move DOM focus onto the focused region's <button>.
  useEffect(() => {
    const area = READING_ORDER[focusIndex];
    const el = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-area="${area}"]`,
    );
    el?.focus({preventScroll: true});
  }, [focusIndex]);

  const clear = () => {
    setSelected([]);
    pushToUrl([]);
    setAnnounce('Selection cleared');
  };

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- section-level keyDown delegates arrow/Enter/Space to the focused child radio; child buttons get native focus semantics */
    <section
      ref={rootRef}
      className={cn('w-full', className)}
      aria-labelledby="body-area-label"
      onKeyDown={onKey}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          id="body-area-label"
          className="text-sm font-semibold uppercase tracking-widest text-[var(--text-subtle)]"
        >
          Body area
        </h3>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        role={multi ? 'group' : 'radiogroup'}
        aria-labelledby="body-area-label"
        aria-describedby={liveId}
        className="relative rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-4"
      >
        <svg
          viewBox="0 0 400 400"
          role="img"
          aria-hidden="true"
          className="w-full max-w-md"
        >
          {/* Simple stylised silhouettes — front (left) + back (right) */}
          {/* Front silhouette */}
          <g fill="none" stroke="var(--color-border-strong, #c9c4ba)" strokeWidth={2}>
            <circle cx={100} cy={50} r={24} />
            <path d="M76 82 L76 140 L72 220 L78 310 L70 388 L88 392 L94 310 L100 230 L106 310 L112 392 L130 388 L122 310 L128 220 L124 140 L124 82 Z" />
            <text x={100} y={12} textAnchor="middle" className="text-[10px] fill-[var(--text-subtle)]" fill="var(--text-subtle, #6a6a6a)" fontSize={10}>
              Front
            </text>
          </g>
          {/* Back silhouette */}
          <g fill="none" stroke="var(--color-border-strong, #c9c4ba)" strokeWidth={2}>
            <circle cx={300} cy={50} r={24} />
            <path d="M276 82 L276 140 L272 220 L278 310 L270 388 L288 392 L294 310 L300 230 L306 310 L312 392 L330 388 L322 310 L328 220 L324 140 L324 82 Z" />
            <text x={300} y={12} textAnchor="middle" fill="var(--text-subtle, #6a6a6a)" fontSize={10}>
              Back
            </text>
          </g>

          {/* Interactive hit regions */}
          {READING_ORDER.map((area, idx) => {
            const hit = HITS[area];
            const isSelected = selected.includes(area);
            const isFocused = focusIndex === idx;
            return (
              <g key={area}>
                <circle
                  cx={hit.cx}
                  cy={hit.cy}
                  r={hit.r}
                  className={cn(
                    'transition-colors',
                    isSelected
                      ? 'fill-[var(--color-primary)]/80'
                      : 'fill-[var(--color-accent)]/15',
                    isFocused && !isSelected && 'fill-[var(--color-accent)]/30',
                  )}
                  stroke={isSelected ? 'var(--color-primary, #1E3A5F)' : 'var(--color-accent, #C87A4B)'}
                  strokeWidth={isFocused ? 2.5 : 1.5}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </svg>

        {/* Accessible buttons absolutely positioned over the SVG hits.
            These carry all click + keyboard + ARIA semantics. */}
        <div className="pointer-events-none absolute inset-4">
          <div className="relative h-full w-full max-w-md">
            {READING_ORDER.map((area, idx) => {
              const hit = HITS[area];
              const isSelected = selected.includes(area);
              const leftPct = ((hit.cx - hit.r) / 400) * 100;
              const topPct = ((hit.cy - hit.r) / 400) * 100;
              const sizePct = ((hit.r * 2) / 400) * 100;
              return (
                <button
                  key={area}
                  type="button"
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={isSelected}
                  aria-label={`${LABELS[area]}${isSelected ? ' (selected)' : ''}`}
                  data-area={area}
                  tabIndex={focusIndex === idx ? 0 : -1}
                  onClick={() => {
                    setFocusIndex(idx);
                    toggle(area);
                  }}
                  onFocus={() => setFocusIndex(idx)}
                  className={cn(
                    'pointer-events-auto absolute rounded-full transition-shadow',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
                  )}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${sizePct}%`,
                    aspectRatio: '1',
                    minWidth: 24,
                    minHeight: 24,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Legend — text labels for users who prefer to read the list */}
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {READING_ORDER.map((area) => {
            const isSelected = selected.includes(area);
            return (
              <li key={area}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs',
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                      : 'border-[var(--color-border-default)] text-[var(--text-secondary)]',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isSelected ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-accent)]/60',
                    )}
                  />
                  {LABELS[area]}
                </span>
              </li>
            );
          })}
        </ul>

        <p
          id={liveId}
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {announce}
        </p>
      </div>
    </section>
  );
}
