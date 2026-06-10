import { describe, expect, it, beforeEach } from 'vitest';
import {
  readTableState,
  writeTableState,
  buildQueryParams,
  countActiveFilters,
  readStoredPageSize,
  type SortState,
} from './useServerTable';

const DEFAULTS = { search: '', status: '', team_id: '' };
const SORTABLE = ['created_at', 'name'] as const;

describe('readTableState', () => {
  it('falls back to defaults when params are absent', () => {
    const state = readTableState(new URLSearchParams(), DEFAULTS, SORTABLE);
    expect(state.filters).toEqual(DEFAULTS);
    expect(state.page).toBe(1);
    expect(state.sort).toBeNull();
  });

  it('reads domain filters from the URL', () => {
    const params = new URLSearchParams('search=foo&status=published&team_id=abc');
    const state = readTableState(params, DEFAULTS, SORTABLE);
    expect(state.filters).toEqual({ search: 'foo', status: 'published', team_id: 'abc' });
  });

  it('ignores unknown params (not in defaults)', () => {
    const params = new URLSearchParams('search=foo&unknown=x');
    const state = readTableState(params, DEFAULTS, SORTABLE);
    expect(state.filters).toEqual({ search: 'foo', status: '', team_id: '' });
    expect('unknown' in state.filters).toBe(false);
  });

  it('parses a valid page', () => {
    expect(readTableState(new URLSearchParams('page=3'), DEFAULTS, SORTABLE).page).toBe(3);
  });

  it('clamps invalid/negative page to 1', () => {
    expect(readTableState(new URLSearchParams('page=0'), DEFAULTS, SORTABLE).page).toBe(1);
    expect(readTableState(new URLSearchParams('page=-2'), DEFAULTS, SORTABLE).page).toBe(1);
    expect(readTableState(new URLSearchParams('page=abc'), DEFAULTS, SORTABLE).page).toBe(1);
  });

  it('reads a whitelisted sort with direction', () => {
    const params = new URLSearchParams('sort_by=name&sort_dir=asc');
    expect(readTableState(params, DEFAULTS, SORTABLE).sort).toEqual({
      columnId: 'name',
      direction: 'asc',
    });
  });

  it('ignores a sort column outside the whitelist (falls to defaultSort)', () => {
    const params = new URLSearchParams('sort_by=evil&sort_dir=asc');
    const defaultSort: SortState = { columnId: 'created_at', direction: 'desc' };
    expect(readTableState(params, DEFAULTS, SORTABLE, defaultSort).sort).toEqual(defaultSort);
  });

  it('defaults direction to asc when sort_dir is invalid', () => {
    const params = new URLSearchParams('sort_by=name&sort_dir=sideways');
    expect(readTableState(params, DEFAULTS, SORTABLE).sort).toEqual({
      columnId: 'name',
      direction: 'asc',
    });
  });
});

describe('writeTableState', () => {
  it('omits default/empty filter values', () => {
    const qs = writeTableState({ search: '', status: 'published', team_id: '' }, DEFAULTS, null, 1);
    expect(qs.toString()).toBe('status=published');
  });

  it('omits page when 1 and includes it otherwise', () => {
    expect(writeTableState(DEFAULTS, DEFAULTS, null, 1).has('page')).toBe(false);
    expect(writeTableState(DEFAULTS, DEFAULTS, null, 4).get('page')).toBe('4');
  });

  it('serializes sort', () => {
    const qs = writeTableState(DEFAULTS, DEFAULTS, { columnId: 'name', direction: 'desc' }, 1);
    expect(qs.get('sort_by')).toBe('name');
    expect(qs.get('sort_dir')).toBe('desc');
  });

  it('round-trips with readTableState', () => {
    const filters = { search: 'hola', status: 'draft', team_id: '' };
    const sort: SortState = { columnId: 'created_at', direction: 'asc' };
    const qs = writeTableState(filters, DEFAULTS, sort, 2);
    const back = readTableState(qs, DEFAULTS, SORTABLE);
    expect(back.filters).toEqual(filters);
    expect(back.sort).toEqual(sort);
    expect(back.page).toBe(2);
  });
});

describe('buildQueryParams', () => {
  it('merges filters, page and per_page', () => {
    const q = buildQueryParams({ search: 'x' }, 2, 25, null);
    expect(q).toEqual({ search: 'x', page: 2, per_page: 25 });
  });

  it('includes sort when present', () => {
    const q = buildQueryParams({ search: 'x' }, 1, 15, { columnId: 'name', direction: 'asc' });
    expect(q).toEqual({ search: 'x', page: 1, per_page: 15, sort_by: 'name', sort_dir: 'asc' });
  });

  it('omits sort keys when null', () => {
    const q = buildQueryParams({}, 1, 15, null);
    expect('sort_by' in q).toBe(false);
    expect('sort_dir' in q).toBe(false);
  });
});

describe('countActiveFilters', () => {
  it('counts only non-default values', () => {
    expect(countActiveFilters({ search: '', status: '', team_id: '' }, DEFAULTS)).toBe(0);
    expect(countActiveFilters({ search: 'a', status: 'published', team_id: '' }, DEFAULTS)).toBe(2);
  });
});

describe('readStoredPageSize', () => {
  beforeEach(() => localStorage.clear());

  it('returns fallback when nothing stored', () => {
    expect(readStoredPageSize('k', 15)).toBe(15);
  });

  it('reads a stored positive integer', () => {
    localStorage.setItem('k:per_page', '50');
    expect(readStoredPageSize('k', 15)).toBe(50);
  });

  it('ignores corrupt/non-positive values', () => {
    localStorage.setItem('k:per_page', 'NaN');
    expect(readStoredPageSize('k', 15)).toBe(15);
    localStorage.setItem('k:per_page', '0');
    expect(readStoredPageSize('k', 15)).toBe(15);
  });
});
