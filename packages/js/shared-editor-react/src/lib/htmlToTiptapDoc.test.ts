import { describe, it, expect } from 'vitest';
import { htmlToTiptapDoc } from './htmlToTiptapDoc';

describe('htmlToTiptapDoc', () => {
  it('converts a paragraph to a TipTap doc', () => {
    const doc = htmlToTiptapDoc('<p>hello</p>');
    expect(doc.type).toBe('doc');
    const para = doc.content[0];
    expect(para.type).toBe('paragraph');
    expect(para.content?.[0]).toMatchObject({ type: 'text', text: 'hello' });
  });

  it('converts a heading and preserves its level', () => {
    const doc = htmlToTiptapDoc('<h2>Sección</h2>');
    expect(doc.content[0]).toMatchObject({ type: 'heading' });
    expect(doc.content[0].attrs?.level).toBe(2);
  });

  it('converts a bullet list into listItems', () => {
    const doc = htmlToTiptapDoc('<ul><li>a</li><li>b</li></ul>');
    const list = doc.content[0];
    expect(list.type).toBe('bulletList');
    expect(list.content).toHaveLength(2);
    expect(list.content?.[0].type).toBe('listItem');
  });

  it('converts a table into table nodes', () => {
    const doc = htmlToTiptapDoc(
      '<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
    );
    expect(doc.content[0].type).toBe('table');
    const row = doc.content[0].content?.[0];
    expect(row?.type).toBe('tableRow');
    expect(row?.content).toHaveLength(2);
  });

  it('preserves bold marks', () => {
    const doc = htmlToTiptapDoc('<p>plain <strong>bold</strong></p>');
    const marks = doc.content[0].content?.find((n) => n.text === 'bold')?.marks;
    expect(marks?.some((m) => m.type === 'bold')).toBe(true);
  });

  it('returns a doc with a single empty paragraph for empty input', () => {
    // TipTap normalises an empty doc to one empty paragraph (a valid doc
    // must hold at least one block), so that — not [] — is the contract.
    const doc = htmlToTiptapDoc('');
    expect(doc.type).toBe('doc');
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0].type).toBe('paragraph');
    expect(doc.content[0].content ?? []).toEqual([]);
  });
});
