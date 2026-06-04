import { describe, it, expect } from 'vitest';
import {
  canonicalTiptapContentJson,
  isSemanticallyEmptyTiptapContent,
  normalizeTiptapContentForCompare,
  tiptapContentEquals,
} from './tiptapContentSemantics';

describe('tiptapContentSemantics', () => {
  it('treats a lone empty paragraph as semantically empty', () => {
    const empty = [{ type: 'paragraph', content: [] }];
    expect(isSemanticallyEmptyTiptapContent(empty)).toBe(true);
    expect(normalizeTiptapContentForCompare(empty)).toEqual([]);
  });

  it('strips trailing empty paragraph so phantom TipTap nodes do not differ', () => {
    const withText = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] }];
    const withPhantom = [
      ...withText,
      { type: 'paragraph', content: [] },
    ];
    expect(tiptapContentEquals(withText, withPhantom)).toBe(true);
    expect(canonicalTiptapContentJson(withPhantom)).toBe(canonicalTiptapContentJson(withText));
  });

  it('detects real edits after normalization', () => {
    const a = [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }];
    const b = [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }];
    expect(tiptapContentEquals(a, b)).toBe(false);
  });

  it('keeps non-empty images as filled', () => {
    const nodes = [{ type: 'image', attrs: { src: 'https://example.com/x.png' } }];
    expect(isSemanticallyEmptyTiptapContent(nodes)).toBe(false);
  });
});
