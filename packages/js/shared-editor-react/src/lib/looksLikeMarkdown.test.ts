import { describe, it, expect } from 'vitest';
import { looksLikeMarkdown } from './looksLikeMarkdown';

describe('looksLikeMarkdown', () => {
  it('detects ATX headings', () => {
    expect(looksLikeMarkdown('## Programa del curso')).toBe(true);
  });

  it('detects ordered and unordered lists', () => {
    expect(looksLikeMarkdown('1. **Introducción a Laravel**')).toBe(true);
    expect(looksLikeMarkdown('- item uno\n- item dos')).toBe(true);
  });

  it('detects fenced code and blockquotes and tables', () => {
    expect(looksLikeMarkdown('```\ncode\n```')).toBe(true);
    expect(looksLikeMarkdown('> cita')).toBe(true);
    expect(looksLikeMarkdown('| a | b |\n| --- | --- |')).toBe(true);
  });

  it('does NOT flag intentional pipe text without a delimiter row', () => {
    expect(looksLikeMarkdown('| Total 1º ASIR | 30 | 1000 | 265')).toBe(false);
  });

  it('detects inline bold/code/links', () => {
    expect(looksLikeMarkdown('texto con **negrita** dentro')).toBe(true);
    expect(looksLikeMarkdown('usa `composer install` aquí')).toBe(true);
    expect(looksLikeMarkdown('ver [docs](https://x.y)')).toBe(true);
  });

  it('leaves ordinary prose untouched', () => {
    expect(looksLikeMarkdown('Esto es un párrafo normal sin formato.')).toBe(false);
    expect(looksLikeMarkdown('Precio: 5 * 3 = 15')).toBe(false);
    expect(looksLikeMarkdown('C# y F# son lenguajes')).toBe(false);
    expect(looksLikeMarkdown('')).toBe(false);
  });
});
