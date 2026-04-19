import {Link} from 'react-router';
import {ChevronRight} from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function Breadcrumbs({items}: {items: BreadcrumbItem[]}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--text-secondary)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-[var(--text-subtle)]" aria-hidden="true" /> : null}
            {i === items.length - 1 ? (
              <span aria-current="page" className="font-medium text-[var(--text-primary)]">
                {item.name}
              </span>
            ) : (
              <Link to={item.href} className="hover:text-[var(--color-primary)] hover:underline">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
