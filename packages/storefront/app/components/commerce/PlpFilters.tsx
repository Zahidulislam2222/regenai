import {useSearchParams} from 'react-router';
import {SlidersHorizontal, X} from 'lucide-react';
import {useState} from 'react';
import {cn} from '~/lib/utils';

/**
 * PLPFilters — collection filter UI driven by URL search params.
 * - Body area (metaobject-driven in Day 11+; stub enum for now)
 * - Condition (metaobject-driven; stub enum)
 * - Evidence level (A/B/C/D)
 * - Price range
 * State lives in searchParams → shareable + SSR-safe.
 */

const BODY_AREAS = ['neck', 'shoulders', 'back', 'hips', 'knees', 'ankles', 'wrists', 'core'];
const CONDITIONS = [
  'posture',
  'chronic-pain',
  'sports-recovery',
  'sleep',
  'stress',
  'arthritis',
  'injury-recovery',
];
const EVIDENCE = ['A', 'B', 'C', 'D'];

export function PlpFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openMobile, setOpenMobile] = useState(false);

  const toggle = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const existing = params.getAll(key);
    if (existing.includes(value)) {
      params.delete(key);
      existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
    setSearchParams(params, {preventScrollReset: true});
  };

  const isActive = (key: string, value: string) => searchParams.getAll(key).includes(value);
  const activeCount = BODY_AREAS.filter((v) => isActive('body_area', v)).length
    + CONDITIONS.filter((v) => isActive('condition', v)).length
    + EVIDENCE.filter((v) => isActive('evidence', v)).length;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams);
    ['body_area', 'condition', 'evidence'].forEach((k) => params.delete(k));
    setSearchParams(params, {preventScrollReset: true});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        aria-label="Open filters"
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-default)] px-3 py-2 text-sm lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-medium text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Desktop sidebar */}
      <aside aria-label="Filters" className="hidden lg:block lg:w-64 lg:shrink-0">
        <FilterGroups
          isActive={isActive}
          toggle={toggle}
          activeCount={activeCount}
          clearAll={clearAll}
        />
      </aside>

      {/* Mobile drawer */}
      {openMobile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)] lg:hidden"
          onClick={() => setOpenMobile(false)}
        >
          <div
            className="ml-auto h-full w-4/5 max-w-sm overflow-y-auto bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-xl)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                aria-label="Close filters"
                className="rounded-md p-2 hover:bg-[var(--color-bone-muted)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <FilterGroups
              isActive={isActive}
              toggle={toggle}
              activeCount={activeCount}
              clearAll={clearAll}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroups({
  isActive,
  toggle,
  activeCount,
  clearAll,
}: {
  isActive: (k: string, v: string) => boolean;
  toggle: (k: string, v: string) => void;
  activeCount: number;
  clearAll: () => void;
}) {
  return (
    <div className="space-y-6">
      {activeCount > 0 ? (
        <button type="button" onClick={clearAll} className="text-xs underline text-[var(--color-primary)]">
          Clear all ({activeCount})
        </button>
      ) : null}

      <FilterSection title="Body area" values={BODY_AREAS} paramKey="body_area" isActive={isActive} toggle={toggle} />
      <FilterSection
        title="Condition"
        values={CONDITIONS}
        paramKey="condition"
        isActive={isActive}
        toggle={toggle}
        formatLabel={(v) => v.replace(/-/g, ' ')}
      />
      <FilterSection
        title="Evidence level"
        values={EVIDENCE}
        paramKey="evidence"
        isActive={isActive}
        toggle={toggle}
      />
    </div>
  );
}

function FilterSection({
  title,
  values,
  paramKey,
  isActive,
  toggle,
  formatLabel,
}: {
  title: string;
  values: string[];
  paramKey: string;
  isActive: (k: string, v: string) => boolean;
  toggle: (k: string, v: string) => void;
  formatLabel?: (v: string) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      <ul className="flex flex-wrap gap-2">
        {values.map((v) => {
          const active = isActive(paramKey, v);
          return (
            <li key={v}>
              <button
                type="button"
                onClick={() => toggle(paramKey, v)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs capitalize transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border-default)] hover:bg-[var(--color-bone-muted)]',
                )}
              >
                {formatLabel ? formatLabel(v) : v}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
