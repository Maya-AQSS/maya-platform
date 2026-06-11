import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import {
  MemoryRouter,
  useLocation,
  useNavigationType,
  type Location,
} from 'react-router-dom';
import {
  buildBackState,
  isSafeInternalPath,
  useBackNavigation,
  type UseBackNavigationOptions,
} from './useBackNavigation';

type InitialEntry = string | { pathname: string; search?: string; state?: unknown };

function wrapperFor(initialEntry: InitialEntry) {
  return ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [initialEntry] }, children);
}

function setup(initialEntry: InitialEntry, options: UseBackNavigationOptions) {
  return renderHook(
    () => {
      const back = useBackNavigation(options);
      const location = useLocation();
      const navigationType = useNavigationType();
      return { ...back, location, navigationType };
    },
    { wrapper: wrapperFor(initialEntry) },
  );
}

describe('isSafeInternalPath', () => {
  it('accepts internal absolute paths', () => {
    expect(isSafeInternalPath('/logs')).toBe(true);
    expect(isSafeInternalPath('/error-codes?search=x&page=2')).toBe(true);
  });

  it('rejects protocol-relative and absolute URLs', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('/\\evil.com')).toBe(false);
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
  });

  it('rejects non-strings and empty values', () => {
    expect(isSafeInternalPath('')).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(42)).toBe(false);
    expect(isSafeInternalPath({ backTo: '/x' })).toBe(false);
    expect(isSafeInternalPath('relative/path')).toBe(false);
  });
});

describe('buildBackState', () => {
  const loc = (pathname: string, search = '', state: unknown = null) =>
    ({ pathname, search, state }) as Pick<Location, 'pathname' | 'search' | 'state'>;

  it('captures pathname + search of the current location', () => {
    expect(buildBackState(loc('/logs', '?level=error&page=3'))).toEqual({
      backTo: ['/logs?level=error&page=3'],
    });
  });

  it('stacks on top of an existing backTo array', () => {
    expect(buildBackState(loc('/themes/9', '', { backTo: ['/themes?page=2'] }))).toEqual({
      backTo: ['/themes?page=2', '/themes/9'],
    });
  });

  it('accepts a legacy string backTo in the current state', () => {
    expect(buildBackState(loc('/documents/5', '', { backTo: '/procesos/3' }))).toEqual({
      backTo: ['/procesos/3', '/documents/5'],
    });
  });

  it('does not duplicate the top entry when re-navigating from the same location', () => {
    const state = { backTo: ['/themes?page=2', '/themes/9'] };
    expect(buildBackState(loc('/themes/9', '', state))).toEqual({
      backTo: ['/themes?page=2', '/themes/9'],
    });
  });

  it('drops unsafe entries from the inherited stack', () => {
    const state = { backTo: ['//evil.com', '/roles?search=a'] };
    expect(buildBackState(loc('/roles/7', '', state))).toEqual({
      backTo: ['/roles?search=a', '/roles/7'],
    });
  });

  it('caps the stack at 5 entries, keeping the most recent ones', () => {
    const state = { backTo: ['/a', '/b', '/c', '/d', '/e'] };
    expect(buildBackState(loc('/f', '', state))).toEqual({
      backTo: ['/b', '/c', '/d', '/e', '/f'],
    });
  });
});

describe('useBackNavigation', () => {
  it('falls back to the entity index when there is no state (direct URL access)', () => {
    const { result } = setup('/logs/123', { fallback: '/logs' });
    expect(result.current.hasBackState).toBe(false);
    expect(result.current.backTarget).toBe('/logs');
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/logs');
  });

  it('navigates to a legacy string backTo preserving its search params', () => {
    const { result } = setup(
      { pathname: '/logs/123', state: { backTo: '/logs?level=error&page=3' } },
      { fallback: '/logs' },
    );
    expect(result.current.hasBackState).toBe(true);
    expect(result.current.backTarget).toBe('/logs?level=error&page=3');
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/logs');
    expect(result.current.location.search).toBe('?level=error&page=3');
  });

  it('pops the stack and re-attaches the rest as state of the destination', () => {
    const { result } = setup(
      { pathname: '/themes/9/edit', state: { backTo: ['/themes?page=2', '/themes/9'] } },
      { fallback: '/themes' },
    );
    expect(result.current.backTarget).toBe('/themes/9');
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/themes/9');
    expect(result.current.location.state).toEqual({ backTo: ['/themes?page=2'] });
  });

  it('leaves no backTo state when the stack is exhausted', () => {
    const { result } = setup(
      { pathname: '/themes/9', state: { backTo: ['/themes?page=2'] } },
      { fallback: '/themes' },
    );
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/themes');
    expect(result.current.location.search).toBe('?page=2');
    expect(result.current.location.state).toBeNull();
  });

  it('ignores forged/unsafe backTo values and uses the fallback', () => {
    const { result } = setup(
      { pathname: '/logs/123', state: { backTo: '//evil.com' } },
      { fallback: '/logs' },
    );
    expect(result.current.hasBackState).toBe(false);
    expect(result.current.backTarget).toBe('/logs');
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/logs');
  });

  it('skips unsafe entries inside a stack', () => {
    const { result } = setup(
      { pathname: '/x', state: { backTo: ['/roles?search=a', 'https://evil.com'] } },
      { fallback: '/roles' },
    );
    expect(result.current.backTarget).toBe('/roles?search=a');
    act(() => result.current.goBack());
    expect(result.current.location.pathname).toBe('/roles');
    expect(result.current.location.search).toBe('?search=a');
  });

  it('pushes by default and replaces when goBack({ replace: true })', () => {
    const pushed = setup(
      { pathname: '/error-codes/7', state: { backTo: '/error-codes?search=x' } },
      { fallback: '/error-codes' },
    );
    act(() => pushed.result.current.goBack());
    expect(pushed.result.current.navigationType).toBe('PUSH');

    const replaced = setup(
      { pathname: '/error-codes/7', state: { backTo: '/error-codes?search=x' } },
      { fallback: '/error-codes' },
    );
    act(() => replaced.result.current.goBack({ replace: true }));
    expect(replaced.result.current.navigationType).toBe('REPLACE');
    expect(replaced.result.current.location.search).toBe('?search=x');
  });
});
