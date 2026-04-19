import {Clock, Activity} from 'lucide-react';

/**
 * ClinicalProtocol — multi-step treatment plan linked to a product.
 * Metaobject-driven (Protocol metaobject). Phase-1 accepts plain props;
 * Phase-1+ wires to Storefront API metaobject query.
 */

export interface ProtocolStep {
  title: string;
  description: string;
  durationMinutes?: number;
  frequencyLabel?: string; // e.g. "3× / week"
}

export interface ClinicalProtocolProps {
  name: string;
  description: string;
  totalWeeks?: number;
  steps: ProtocolStep[];
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  reviewedBy?: {name: string; credentials: string};
}

export function ClinicalProtocol({
  name,
  description,
  totalWeeks,
  steps,
  evidenceLevel,
  reviewedBy,
}: ClinicalProtocolProps) {
  return (
    <section aria-labelledby="protocol-heading" className="rounded-lg border border-[var(--color-border-default)] bg-[var(--surface-card)] p-5 sm:p-6">
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="protocol-heading" className="text-lg font-semibold text-[var(--text-primary)]">
            {name}
          </h3>
          {evidenceLevel ? (
            <span className="rounded-full bg-[var(--color-sage)] px-2 py-0.5 text-[10px] font-medium text-white">
              Evidence level {evidenceLevel}
            </span>
          ) : null}
          {totalWeeks ? (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-subtle)]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {totalWeeks} week{totalWeeks > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </header>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="relative flex gap-4 border-l-2 border-[var(--color-bone-subtle)] pl-4">
            <div className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
              {i + 1}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</h4>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{step.description}</p>
              {(step.durationMinutes || step.frequencyLabel) ? (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-subtle)]">
                  {step.durationMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {step.durationMinutes} min
                    </span>
                  ) : null}
                  {step.frequencyLabel ? (
                    <span className="inline-flex items-center gap-1">
                      <Activity className="h-3 w-3" aria-hidden="true" />
                      {step.frequencyLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {reviewedBy ? (
        <footer className="mt-4 border-t border-[var(--color-border-default)] pt-3 text-xs text-[var(--text-subtle)]">
          Clinician-reviewed: <span className="font-medium text-[var(--text-secondary)]">{reviewedBy.name}, {reviewedBy.credentials}</span>
        </footer>
      ) : null}
    </section>
  );
}
