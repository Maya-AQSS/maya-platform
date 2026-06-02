/**
 * Split an HTML fragment into top-level "block chunks".
 *
 * Domain-agnostic, no React. Walks the top-level children of the parsed
 * `<body>` and maps each element to a {@link BlockChunk}, preserving its
 * outer HTML for a lossless round-trip into the editor. Used by the
 * docx-to-blocks importer: mammoth → HTML → chunks → user grouping → blocks.
 *
 * Structural containers (tables, lists, figures) are kept atomic — never
 * split — so the TipTap schema stays valid when each chunk is converted.
 */

export type BlockChunkType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'figure'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'other';

export interface BlockChunk {
  /** Stable index in document order. */
  index: number;
  /** Semantic type for filtering + icon. */
  type: BlockChunkType;
  /** Heading level when `type === 'heading'` (1-6). */
  level?: number;
  /** HTML serialisation of the element (preserved for round-trip). */
  html: string;
  /** Plain-text snippet, max 200 chars, for the list label. */
  text: string;
  /** True for empty `<p>`/`<br>`-only paragraphs (callers may skip). */
  isEmpty: boolean;
}

const TEXT_SNIPPET_MAX = 200;

function classify(tagName: string): { type: BlockChunkType; level?: number } {
  const tag = tagName.toLowerCase();
  const headingMatch = /^h([1-6])$/.exec(tag);
  if (headingMatch) return { type: 'heading', level: Number(headingMatch[1]) };
  switch (tag) {
    case 'p':
      return { type: 'paragraph' };
    case 'ul':
    case 'ol':
      return { type: 'list' };
    case 'table':
      return { type: 'table' };
    case 'figure':
      return { type: 'figure' };
    case 'blockquote':
      return { type: 'blockquote' };
    case 'pre':
      return { type: 'codeBlock' };
    case 'hr':
      return { type: 'horizontalRule' };
    default:
      return { type: 'other' };
  }
}

function snippet(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length > TEXT_SNIPPET_MAX
    ? `${collapsed.slice(0, TEXT_SNIPPET_MAX - 1)}…`
    : collapsed;
}

/**
 * A paragraph is "empty" when it carries no text and no meaningful content
 * (only whitespace and/or `<br>` elements). Mammoth emits these as Word
 * paragraph separators — pure visual noise the importer offers to skip.
 */
function isEmptyParagraph(el: Element): boolean {
  if ((el.textContent ?? '').trim() !== '') return false;
  // Any non-<br> element child (e.g. <img>) makes it non-empty.
  return Array.from(el.children).every((child) => child.tagName.toLowerCase() === 'br');
}

export function splitHtmlIntoBlocks(html: string): BlockChunk[] {
  if (!html || !html.trim()) return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const children = Array.from(doc.body.children);

  return children.map((el, index) => {
    const { type, level } = classify(el.tagName);
    const isEmpty = type === 'paragraph' && isEmptyParagraph(el);
    return {
      index,
      type,
      ...(level !== undefined ? { level } : {}),
      html: el.outerHTML,
      text: snippet(el.textContent ?? ''),
      isEmpty,
    };
  });
}
