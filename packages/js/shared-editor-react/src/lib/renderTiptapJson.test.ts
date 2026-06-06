import { describe, it, expect } from 'vitest';
import { renderTiptapJsonToHtml } from './renderTiptapJson';
import type { TiptapDoc } from '../types';

describe('renderTiptapJsonToHtml', () => {
  it('renders a wrapped doc', () => {
    const doc: TiptapDoc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'hola' }] },
      ],
    };
    const html = renderTiptapJsonToHtml(doc);
    expect(html).toContain('<p');
    expect(html).toContain('hola');
  });

  it('accepts a bare content array (the shape MayaEditor emits)', () => {
    const html = renderTiptapJsonToHtml([
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Sección' }] },
    ]);
    expect(html).toMatch(/<h2[^>]*>.*Sección.*<\/h2>/s);
  });

  it('renders bold marks as <strong>', () => {
    const html = renderTiptapJsonToHtml([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'plain ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        ],
      },
    ]);
    expect(html).toMatch(/<strong[^>]*>bold<\/strong>/);
  });

  it('renders a code block without interpreting markdown inside it', () => {
    const html = renderTiptapJsonToHtml([
      { type: 'codeBlock', content: [{ type: 'text', text: '## not a heading' }] },
    ]);
    expect(html).toContain('<pre');
    expect(html).toContain('## not a heading');
  });

  it('does NOT turn literal markdown text into formatting (data, not render)', () => {
    // Regression guard: markdown stored as plain text must render literally —
    // this is why the fix lives at ingestion, not in the renderer.
    const html = renderTiptapJsonToHtml([
      { type: 'paragraph', content: [{ type: 'text', text: '## Programa **negrita**' }] },
    ]);
    expect(html).toContain('## Programa **negrita**');
    expect(html).not.toContain('<h2');
    expect(html).not.toContain('<strong>');
  });

  it('renders a table', () => {
    const html = renderTiptapJsonToHtml([
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }] },
              { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }] },
            ],
          },
        ],
      },
    ]);
    expect(html).toContain('<table');
    expect(html).toContain('A');
    expect(html).toContain('B');
  });

  it('returns empty string for null/empty content', () => {
    expect(renderTiptapJsonToHtml(null)).toBe('');
    expect(renderTiptapJsonToHtml([])).toBe('');
    expect(renderTiptapJsonToHtml(undefined)).toBe('');
  });
});
