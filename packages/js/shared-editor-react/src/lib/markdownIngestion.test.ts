/**
 * Guards the paste/ingestion contract used by MayaEditor's `handlePaste`:
 * Markdown text → HTML (markdownToHtml) → TipTap nodes (htmlToTiptapDoc) must
 * yield STRUCTURED nodes, never a single literal text node. This is the fix for
 * the "## " / "**bold**" rendered verbatim bug (a data/ingestion problem).
 */
import { describe, it, expect } from 'vitest';
import { markdownToHtml } from './markdownToHtml';
import { htmlToTiptapDoc } from './htmlToTiptapDoc';
import { looksLikeMarkdown } from './looksLikeMarkdown';

function ingest(md: string) {
  return htmlToTiptapDoc(markdownToHtml(md));
}

describe('markdown ingestion pipeline', () => {
  it('turns a heading line into a heading node, not literal "## "', () => {
    const md = '## Programa del curso';
    expect(looksLikeMarkdown(md)).toBe(true);
    const doc = ingest(md);
    const heading = doc.content.find((n) => n.type === 'heading');
    expect(heading).toBeTruthy();
    expect(heading?.attrs?.level).toBe(2);
    const text = JSON.stringify(doc);
    expect(text).not.toContain('## Programa');
  });

  it('turns an ordered list with bold into list + strong nodes', () => {
    const doc = ingest('1. **Introducción a Laravel 13.**');
    const list = doc.content.find((n) => n.type === 'orderedList');
    expect(list).toBeTruthy();
    const json = JSON.stringify(doc);
    expect(json).toContain('"bold"');
    expect(json).not.toContain('**Introducción');
  });

  it('turns inline bold into a strong node', () => {
    const doc = ingest('CICLO FORMATIVO DE **NOMBRE_DEL_CICLO**');
    const json = JSON.stringify(doc);
    expect(json).toContain('"bold"');
    expect(json).toContain('NOMBRE_DEL_CICLO');
    expect(json).not.toContain('**NOMBRE_DEL_CICLO**');
  });
});
