import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useServerTable } from './useServerTable';

const DEFAULTS = { search: '', status: '' };
const SORTABLE = ['created_at', 'name'] as const;

function wrapperFor(initialEntry: string) {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [initialEntry] }, children);
}

function setup(initialEntry = '/') {
  return renderHook(
    () =>
      useServerTable({
        defaults: DEFAULTS,
        sortableColumns: SORTABLE,
        storageKey: 'test:table',
        defaultSort: { columnId: 'created_at', direction: 'desc' },
        defaultPageSize: 15,
      }),
    { wrapper: wrapperFor(initialEntry) },
  );
}

describe('useServerTable hook', () => {
  beforeEach(() => localStorage.clear());

  it('exposes defaults on a clean URL', () => {
    const { result } = setup('/');
    expect(result.current.filters).toEqual(DEFAULTS);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(15);
    expect(result.current.sortBy).toEqual({ columnId: 'created_at', direction: 'desc' });
    expect(result.current.queryParams).toEqual({
      search: '',
      status: '',
      page: 1,
      per_page: 15,
      sort_by: 'created_at',
      sort_dir: 'desc',
    });
  });

  it('hydrates state from the URL', () => {
    const { result } = setup('/?search=hola&status=draft&page=3&sort_by=name&sort_dir=asc');
    expect(result.current.filters).toEqual({ search: 'hola', status: 'draft' });
    expect(result.current.page).toBe(3);
    expect(result.current.sortBy).toEqual({ columnId: 'name', direction: 'asc' });
  });

  it('setFilter updates the filter and resets page to 1', () => {
    const { result } = setup('/?page=4');
    act(() => result.current.setFilter('search', 'foo'));
    expect(result.current.filters.search).toBe('foo');
    expect(result.current.page).toBe(1);
  });

  it('resetFilters clears domain filters but keeps sort', () => {
    const { result } = setup('/?search=foo&status=draft&sort_by=name&sort_dir=asc');
    act(() => result.current.resetFilters());
    expect(result.current.filters).toEqual(DEFAULTS);
    expect(result.current.sortBy).toEqual({ columnId: 'name', direction: 'asc' });
  });

  it('onPageChange keeps filters and sort', () => {
    const { result } = setup('/?search=foo&sort_by=name&sort_dir=asc');
    act(() => result.current.onPageChange(5));
    expect(result.current.page).toBe(5);
    expect(result.current.filters.search).toBe('foo');
    expect(result.current.sortBy).toEqual({ columnId: 'name', direction: 'asc' });
  });

  it('onSortChange applies a whitelisted column and resets page', () => {
    const { result } = setup('/?page=3');
    act(() => result.current.onSortChange({ columnId: 'name', direction: 'asc' }));
    expect(result.current.sortBy).toEqual({ columnId: 'name', direction: 'asc' });
    expect(result.current.page).toBe(1);
  });

  it('onSortChange ignores a column outside the whitelist', () => {
    const { result } = setup('/?sort_by=name&sort_dir=asc');
    act(() => result.current.onSortChange({ columnId: 'evil', direction: 'asc' }));
    // unchanged
    expect(result.current.sortBy).toEqual({ columnId: 'name', direction: 'asc' });
  });

  it('onPageSizeChange persists size and resets page', () => {
    const { result } = setup('/?page=4');
    act(() => result.current.onPageSizeChange(50));
    expect(result.current.pageSize).toBe(50);
    expect(result.current.page).toBe(1);
    expect(localStorage.getItem('test:table:per_page')).toBe('50');
  });

  it('reports active filter count', () => {
    const { result } = setup('/?search=foo&status=draft');
    expect(result.current.filtersActiveCount).toBe(2);
  });
});
