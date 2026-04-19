import {cn} from '~/lib/utils';

/**
 * VariantPicker — option groups (Size, Color, etc.) with availability state.
 * Radio-group semantics for a11y. Disabled+line-through for OOS variants.
 */

export interface VariantOption {
  id: string;
  name: string; // option-group name, e.g. "Size"
  values: Array<{value: string; available: boolean; selected: boolean}>;
}

export interface VariantPickerProps {
  options: VariantOption[];
  onSelect: (optionName: string, value: string) => void;
}

export function VariantPicker({options, onSelect}: VariantPickerProps) {
  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <fieldset key={opt.id}>
          <legend className="mb-2 text-sm font-medium text-[var(--text-primary)]">{opt.name}</legend>
          <div role="radiogroup" aria-label={opt.name} className="flex flex-wrap gap-2">
            {opt.values.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={v.selected}
                disabled={!v.available}
                onClick={() => onSelect(opt.name, v.value)}
                className={cn(
                  'rounded-md border px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
                  v.selected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bone-muted)]',
                  !v.available && 'opacity-50 line-through cursor-not-allowed',
                )}
              >
                {v.value}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
