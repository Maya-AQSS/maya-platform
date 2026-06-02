import { describe, it, expect } from 'vitest';
import { splitHtmlIntoBlocks } from './splitHtmlIntoBlocks';

describe('splitHtmlIntoBlocks', () => {
  it('returns one chunk per top-level paragraph', () => {
    const html = '<p>uno</p><p>dos</p><p>tres</p><p>cuatro</p><p>cinco</p>';
    const chunks = splitHtmlIntoBlocks(html);
    expect(chunks).toHaveLength(5);
    expect(chunks.every((c) => c.type === 'paragraph')).toBe(true);
    expect(chunks.map((c) => c.index)).toEqual([0, 1, 2, 3, 4]);
    expect(chunks[0].text).toBe('uno');
  });

  it('classifies heading, paragraph, table and list', () => {
    const html =
      '<h1>Título</h1><p>Intro</p><table><tr><td>a</td></tr></table><ul><li>x</li></ul>';
    const chunks = splitHtmlIntoBlocks(html);
    expect(chunks.map((c) => c.type)).toEqual(['heading', 'paragraph', 'table', 'list']);
    expect(chunks[0].level).toBe(1);
  });

  it('captures heading level for h1-h6', () => {
    const chunks = splitHtmlIntoBlocks('<h3>tres</h3><h6>seis</h6>');
    expect(chunks[0]).toMatchObject({ type: 'heading', level: 3 });
    expect(chunks[1]).toMatchObject({ type: 'heading', level: 6 });
  });

  it('flags whitespace-only / <br>-only paragraphs as empty', () => {
    const chunks = splitHtmlIntoBlocks('<p>   </p><p><br></p><p>real</p>');
    expect(chunks[0].isEmpty).toBe(true);
    expect(chunks[1].isEmpty).toBe(true);
    expect(chunks[2].isEmpty).toBe(false);
  });

  it('does not flag a paragraph with an image as empty', () => {
    const chunks = splitHtmlIntoBlocks('<p><img src="x.png"></p>');
    expect(chunks[0].isEmpty).toBe(false);
  });

  it('maps unknown / wrapper elements to "other"', () => {
    const chunks = splitHtmlIntoBlocks('<div><p>anidado</p></div>');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].type).toBe('other');
  });

  it('preserves outerHTML for round-trip', () => {
    const chunks = splitHtmlIntoBlocks('<h2>Sección</h2>');
    expect(chunks[0].html).toBe('<h2>Sección</h2>');
  });

  it('truncates long text snippets to 200 chars', () => {
    const long = 'a'.repeat(500);
    const chunks = splitHtmlIntoBlocks(`<p>${long}</p>`);
    expect(chunks[0].text.length).toBe(200);
    expect(chunks[0].text.endsWith('…')).toBe(true);
  });

  it('returns [] for empty or whitespace input', () => {
    expect(splitHtmlIntoBlocks('')).toEqual([]);
    expect(splitHtmlIntoBlocks('   ')).toEqual([]);
  });
});
