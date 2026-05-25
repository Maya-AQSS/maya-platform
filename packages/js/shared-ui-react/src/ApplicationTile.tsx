import { Link } from 'react-router-dom';

type ApplicationTileProps = {
  href: string;
  name: string;
  total: number;
  totalLabel: string;
  ariaLabel: string;
};

export function ApplicationTile({
  href,
  name,
  total,
  totalLabel,
  ariaLabel,
}: ApplicationTileProps) {
  const initial = (name?.charAt(0) ?? '').toUpperCase();

  return (
    <Link
      to={href}
      aria-label={ariaLabel}
      className={[
        'group relative flex min-h-[4.5rem] items-stretch gap-3 overflow-hidden rounded-lg border border-ui-border bg-ui-card p-1 shadow-card',
        'transition-all duration-200 hover:-translate-y-0.5 hover:border-odoo-purple/30 hover:shadow-lg hover:shadow-odoo-purple/[0.08]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-odoo-purple',
        'dark:border-ui-dark-border dark:bg-ui-dark-card dark:hover:border-odoo-purple-l/50 dark:hover:shadow-black/30',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="flex w-14 shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-b from-odoo-purple to-odoo-purple-d text-lg font-bold text-text-inverse shadow-inner shadow-black/25"
      >
        {initial}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-1">
        <span className="truncate text-base font-semibold text-text-primary group-hover:text-odoo-purple dark:text-text-dark-primary dark:group-hover:text-odoo-purple-l">
          {name}
        </span>
        <span className="mt-0.5 text-xs font-medium text-text-muted dark:text-text-dark-muted">
          {totalLabel}
        </span>
      </span>

      <span className="flex shrink-0 items-center pr-2 sm:pr-3">
        <span className="inline-flex min-w-[2.75rem] items-center justify-center rounded-full bg-gradient-to-b from-warning to-warning-dark px-3 py-1.5 text-lg font-bold tabular-nums text-text-primary shadow-sm ring-1 ring-warning-dark/20 dark:from-warning dark:to-warning-dark dark:text-text-primary">
          {total}
        </span>
      </span>
    </Link>
  );
}
