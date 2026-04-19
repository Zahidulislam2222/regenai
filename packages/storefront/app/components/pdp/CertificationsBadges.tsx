import {Award, ShieldCheck, FlaskConical, CheckCircle2} from 'lucide-react';

const ICON_MAP = {
  award: Award,
  shield: ShieldCheck,
  flask: FlaskConical,
  check: CheckCircle2,
} as const;

export interface CertificationBadge {
  label: string;
  icon?: keyof typeof ICON_MAP;
  body?: string; // certifying body name, e.g. "USP"
  verifiedDate?: string; // ISO date
}

export function CertificationsBadges({items}: {items: CertificationBadge[]}) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Certifications" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon ?? 'check'];
        return (
          <li
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bone-subtle)] px-3 py-1.5 text-xs"
          >
            <Icon className="h-4 w-4 text-[var(--color-sage)]" aria-hidden="true" />
            <span className="font-medium">{item.label}</span>
            {item.body ? <span className="text-[var(--text-subtle)]">· {item.body}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
