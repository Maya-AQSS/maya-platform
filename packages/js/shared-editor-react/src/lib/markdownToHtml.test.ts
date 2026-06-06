import { describe, it, expect } from 'vitest';
import { markdownToHtml } from './markdownToHtml';

describe('markdownToHtml', () => {
  it('bolds **text** and emphasises *text*', () => {
    expect(markdownToHtml('**b**')).toContain('<strong>b</strong>');
    expect(markdownToHtml('*i*')).toContain('<em>i</em>');
  });

  it('does NOT emphasise intra-word underscores (CommonMark)', () => {
    // Regression: placeholders like NOMBRE_DEL_CICLO must survive intact.
    const html = markdownToHtml('CICLO DE **NOMBRE_DEL_CICLO**');
    expect(html).toContain('NOMBRE_DEL_CICLO');
    expect(html).not.toContain('<em>DEL</em>');
    expect(html).toContain('<strong>NOMBRE_DEL_CICLO</strong>');
  });

  it('still emphasises standalone _word_', () => {
    expect(markdownToHtml('hola _mundo_ chau')).toContain('<em>mundo</em>');
  });

  it('renders ATX headings', () => {
    expect(markdownToHtml('## Programa')).toMatch(/<h2[^>]*>Programa<\/h2>/);
  });
});
