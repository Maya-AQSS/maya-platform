import { describe, it, expect } from 'vitest';
import { buildToolbarLabels } from './buildToolbarLabels';
import { DEFAULT_LABELS } from '../components/EditorToolbar';

describe('buildToolbarLabels', () => {
  it('maps every label key through t("editor.<key>")', () => {
    const dict: Record<string, string> = {
      'editor.bold': 'Negrita',
      'editor.italic': 'Cursiva',
      'editor.groupFont': 'Fuente',
      'editor.tableAddColumnAfter': 'Insertar columna a la derecha',
    };
    const t = (k: string) => dict[k] ?? k;

    const labels = buildToolbarLabels(t);
    expect(labels.bold).toBe('Negrita');
    expect(labels.italic).toBe('Cursiva');
    expect(labels.groupFont).toBe('Fuente');
    expect(labels.tableAddColumnAfter).toBe('Insertar columna a la derecha');
  });

  it('falls back to the English default when a key is missing (t returns the key)', () => {
    const t = (k: string) => k; // i18next miss behaviour: returns the key
    const labels = buildToolbarLabels(t);
    expect(labels.bold).toBe(DEFAULT_LABELS.bold);
    expect(labels.groupParagraph).toBe(DEFAULT_LABELS.groupParagraph);
    // never leaks a raw "editor.*" key
    expect(labels.bold).not.toContain('editor.');
  });

  it('honours a custom prefix', () => {
    const t = (k: string) => (k === 'tt.bold' ? 'B!' : k);
    const labels = buildToolbarLabels(t, 'tt');
    expect(labels.bold).toBe('B!');
  });

  it('returns a fully-populated object (all default keys present)', () => {
    const labels = buildToolbarLabels((k) => k);
    for (const key of Object.keys(DEFAULT_LABELS)) {
      expect(labels[key as keyof typeof labels]).toBeTruthy();
    }
  });
});
