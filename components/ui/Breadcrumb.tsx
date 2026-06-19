import { Fragment } from 'react';

import { Link } from '@/i18n/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string; // If undefined, renders as the current page (no link).
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-surface/50" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-surface/30">/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-gold">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-white">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
