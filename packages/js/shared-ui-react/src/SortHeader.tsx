import type { SortDirection } from './DataTable'

type SortHeaderProps<K extends string> = {
  label: string
  column: K
  activeColumn: K | null | undefined
  direction: SortDirection | null | undefined
  onSort: (column: K) => void
  title?: string
}

export function SortHeader<K extends string>({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  title,
}: SortHeaderProps<K>) {
  const isActive = activeColumn === column
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      title={title}
      className="inline-flex w-full min-w-0 items-center gap-2.5 select-none uppercase tracking-wide text-left font-bold text-inherit cursor-pointer rounded-sm hover:bg-ui-body dark:hover:bg-ui-dark-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-odoo-purple/40"
    >
      <span className="truncate">{label}</span>
      {isActive ? (
        <span
          className="shrink-0 pl-1 text-text-secondary dark:text-text-dark-secondary"
          aria-hidden
        >
          {direction === 'asc' ? '↑' : '↓'}
        </span>
      ) : (
        <span
          className="shrink-0 pl-1 text-xs text-text-muted dark:text-text-dark-muted"
          aria-hidden
        >
          ↕
        </span>
      )}
    </button>
  )
}
