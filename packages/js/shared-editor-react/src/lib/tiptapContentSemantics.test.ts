import { describe, it, expect } from 'vitest';
import {
  canonicalTiptapContentJson,
  isSemanticallyEmptyTiptapContent,
  normalizeTiptapContentForCompare,
  normalizeTiptapContentForPersistence,
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

  it('ignores table colwidth attrs added by the editor on open', () => {
    const fromTemplate = [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
              },
            ],
          },
        ],
      },
    ];
    const afterEditor = [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colwidth: [120] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
              },
            ],
          },
        ],
      },
    ];
    expect(tiptapContentEquals(fromTemplate, afterEditor)).toBe(true);
  });

  it('ignores volatile image attrs added by the editor on open', () => {
    const fromTemplate = [{ type: 'image', attrs: { src: 'https://example.com/x.png', alt: 'Logo' } }];
    const afterEditor = [{
      type: 'image',
      attrs: {
        src: 'https://example.com/x.png',
        alt: 'Logo',
        width: 400,
        height: 200,
        class: 'ProseMirror-selectednode',
      },
    }];
    expect(tiptapContentEquals(fromTemplate, afterEditor)).toBe(true);
  });

  it('treats tableHeader cells as tableCell for template parity', () => {
    const fromTemplate = [{
      type: 'table',
      content: [{
        type: 'tableRow',
        content: [{
          type: 'tableCell',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
        }],
      }],
    }];
    const afterEditor = [{
      type: 'table',
      content: [{
        type: 'tableRow',
        content: [{
          type: 'tableHeader',
          attrs: { colwidth: [90] },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }],
        }],
      }],
    }];
    expect(tiptapContentEquals(fromTemplate, afterEditor)).toBe(true);
  });

  it('does not treat paragraph with nested image as semantically empty', () => {
    const nodes = [{
      type: 'paragraph',
      content: [{ type: 'image', attrs: { src: 'https://example.com/x.png' } }],
    }];
    expect(isSemanticallyEmptyTiptapContent(nodes)).toBe(false);
  });

  it('preserves heading level and text for persistence', () => {
    const heading = [{
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Título H1' }],
    }];
    expect(normalizeTiptapContentForPersistence(heading)).toEqual(heading);
  });

  it('compare normalization keeps text on inline nodes', () => {
    const nodes = [{
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hola' }],
    }];
    expect(normalizeTiptapContentForCompare(nodes)).toEqual(nodes);
  });

  it('ignores phantom empty paragraphs inside table cells', () => {
    const template = [{
      type: 'table',
      content: [{
        type: 'tableRow',
        content: [{
          type: 'tableCell',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'c' }] }],
        }],
      }],
    }];
    const afterEditor = [{
      type: 'table',
      content: [{
        type: 'tableRow',
        content: [{
          type: 'tableCell',
          attrs: { colwidth: [100] },
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'c' }] },
            { type: 'paragraph', content: [] },
          ],
        }],
      }],
    }];
    expect(tiptapContentEquals(template, afterEditor)).toBe(true);
  });

  it('ignores empty list items added by pressing Enter without content', () => {
    const template = [{
      type: 'bulletList',
      content: [{
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Uno' }] }],
      }],
    }];
    const afterEditor = [{
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Uno' }] }],
        },
      ],
    }];
    expect(tiptapContentEquals(template, afterEditor)).toBe(true);
  });

  it('ignores trailing empty list item at end of list', () => {
    const template = [{
      type: 'bulletList',
      content: [{
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Uno' }] }],
      }],
    }];
    const afterEditor = [{
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Uno' }] }],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [] }],
        },
      ],
    }];
    expect(tiptapContentEquals(template, afterEditor)).toBe(true);
  });
});
