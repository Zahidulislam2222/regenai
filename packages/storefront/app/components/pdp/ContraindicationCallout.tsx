import {AlertTriangle} from 'lucide-react';

/**
 * ContraindicationCallout — mandatory block for FDA class II devices
 * (TENS/EMS) and supplement SKUs with known interactions.
 * role=note + explicit "Contraindications" heading for WCAG + linter (D41
 * compliance-lint will enforce presence on relevant PDPs).
 */

export interface ContraindicationCalloutProps {
  items: string[];
  fdaClass?: 'Class I' | 'Class II' | 'Class III';
  intensityNote?: string;
}

export function ContraindicationCallout({items, fdaClass, intensityNote}: ContraindicationCalloutProps) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="contra-heading"
      role="note"
      className="rounded-md border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-4 text-sm"
      data-pdp-block="contraindications"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
        <div className="flex-1">
          <h3 id="contra-heading" className="font-semibold text-[var(--color-warning)]">
            Contraindications{fdaClass ? ` — FDA ${fdaClass}` : ''}
          </h3>
          <p className="mt-1 text-[var(--color-warning)]">
            Do not use if any of the following apply. Consult a clinician before starting.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--color-warning)]">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {intensityNote ? (
            <p className="mt-2 text-xs text-[var(--color-warning)]">{intensityNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
