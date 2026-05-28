import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type FilterRecord = Record<string, string | undefined>;

export interface UseFilterStateResult<T extends FilterRecord> {
  filters: T;
  setFilter: (key: keyof T, value: string | undefined) => void;
  setFilters: (patch: Partial<T>) => void;
  resetFilters: () => void;
}

/**
 * URL-backed filter state. Stores all filter values as URL query params.
 * Changing any filter resets page to 1 automatically.
 *
 * Usage:
 *   const { filters, setFilter } = useFilterState({ search: '', status: '' });
 */
export function useFilterState<T extends FilterRecord>(
  defaults: T,
): UseFilterStateResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo((): T => {
    const result = { ...defaults } as T;
    for (const key of Object.keys(defaults) as Array<keyof T & string>) {
      const value = searchParams.get(key);
      if (value !== null) {
        (result as FilterRecord)[key] = value;
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setFilter = useCallback(
    (key: keyof T, value: string | undefined): void => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === undefined || value === '') {
          next.delete(key as string);
        } else {
          next.set(key as string, value);
        }
        next.delete('page');
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<T>): void => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '') {
            next.delete(k);
          } else {
            next.set(k, v as string);
          }
        }
        next.delete('page');
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const resetFilters = useCallback((): void => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, setFilters, resetFilters };
}
