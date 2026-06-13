import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createDomainTableHook } from './createDomainTableHook';

const DEFAULTS = { search: '', status: '' };
const SORTABLE = ['created_at', 'name'] as const;

function wrapperFor(initialEntry: string) {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [initialEntry] }, children);
}

describe('createDomainTableHook', () => {
  beforeEach(() => localStorage.clear());

  it('fetches rows + meta on mount and exposes them', async () => {
    const fetcher = vi.fn().mockResolvedValue({ rows: [{ id: 1 }], meta: { total: 1 } });
    const useTable = createDomainTableHook({
      defaults: DEFAULTS,
      sortableColumns: SORTABLE,
      storageKey: 'k',
      fetcher,
    });

    const { result } = renderHook(() => useTable(), { wrapper: wrapperFor('/') });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.rows).toEqual([{ id: 1 }]);
    expect(result.current.meta).toEqual({ total: 1 });
  });

  it('does not fetch when enabled is false and keeps rows empty', async () => {
    const fetcher = vi.fn().mockResolvedValue({ rows: [{ id: 1 }], meta: null });
    const useTable = createDomainTableHook({
      defaults: DEFAULTS,
      sortableColumns: SORTABLE,
      storageKey: 'k',
      fetcher,
    });

    const { result } = renderHook(() => useTable({ enabled: false }), {
      wrapper: wrapperFor('/'),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
    expect(result.current.enabled).toBe(false);
  });

  it('refetches when a filter changes', async () => {
    const fetcher = vi.fn().mockResolvedValue({ rows: [], meta: null });
    const useTable = createDomainTableHook({
      defaults: DEFAULTS,
      sortableColumns: SORTABLE,
      storageKey: 'k',
      fetcher,
    });

    const { result } = renderHook(() => useTable(), { wrapper: wrapperFor('/') });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    act(() => result.current.setFilter('search', 'foo'));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    const lastArg = fetcher.mock.calls.at(-1)?.[0] as { search?: string };
    expect(lastArg.search).toBe('foo');
  });

  it('applies mapParams before calling the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ rows: [], meta: null });
    const useTable = createDomainTableHook({
      defaults: DEFAULTS,
      sortableColumns: SORTABLE,
      storageKey: 'k',
      fetcher,
      mapParams: (p) => ({ ...p, q: p.search }),
    });

    const { result } = renderHook(() => useTable(), { wrapper: wrapperFor('/?search=hi') });

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    void result.current;
    const arg = fetcher.mock.calls.at(-1)?.[0] as { q?: string };
    expect(arg.q).toBe('hi');
  });
});
