import {useState, useEffect} from 'react';
import {X} from 'lucide-react';
import {cn} from '~/lib/utils';

/**
 * AnnouncementBar — dismissible, cookie-persisted, merchant-editable.
 * Height collapses to 0 when dismissed; returns on next campaign (cookie
 * keyed by campaign id).
 */

export interface AnnouncementBarProps {
  message: string;
  campaignId: string;
  cta?: {label: string; href: string};
  tone?: 'brand' | 'sage' | 'accent';
}

const toneClasses: Record<NonNullable<AnnouncementBarProps['tone']>, string> = {
  brand: 'bg-[var(--color-primary)] text-[var(--text-inverse)]',
  sage: 'bg-[var(--color-sage)] text-[var(--text-inverse)]',
  accent: 'bg-[var(--color-accent)] text-[var(--text-inverse)]',
};

const STORAGE_KEY_PREFIX = 'regenai:announcement-dismissed:';

export function AnnouncementBar({message, campaignId, cta, tone = 'brand'}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY_PREFIX + campaignId) === '1');
    } catch {}
  }, [campaignId]);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + campaignId, '1');
    } catch {}
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center gap-3 px-4 py-2 text-sm',
        toneClasses[tone],
      )}
      role="region"
      aria-label="Site announcement"
    >
      <p className="text-center">{message}</p>
      {cta ? (
        <a href={cta.href} className="underline underline-offset-2 hover:no-underline">
          {cta.label}
        </a>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
