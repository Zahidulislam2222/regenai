import {ShieldCheck, Award, HeartPulse, FlaskConical} from 'lucide-react';

const ITEMS = [
  {icon: ShieldCheck, label: 'Clinician-reviewed', sub: 'Every product vetted by licensed PTs / MDs'},
  {icon: Award, label: 'Research-referenced', sub: 'Claims backed by linked PubMed IDs'},
  {icon: FlaskConical, label: 'Third-party tested', sub: 'Independent lab verification'},
  {icon: HeartPulse, label: 'Contraindication-aware', sub: 'Cart-level safety checks'},
];

export function TrustStrip() {
  return (
    <section
      aria-label="Trust signals"
      className="border-y border-[var(--color-border-default)] bg-[var(--surface-card)]"
    >
      <ul className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <item.icon
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-sage)]"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{item.label}</p>
              <p className="text-xs text-[var(--text-subtle)]">{item.sub}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
