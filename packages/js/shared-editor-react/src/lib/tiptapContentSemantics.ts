import type { TiptapDoc, TiptapNode } from '../types';

const MEANINGFUL_BLOCK_TYPES = new Set([
  'image',
  'table',
  'iframeBlock',
  'alertBlock',
  'horizontalRule',
  'codeBlock',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asNode(value: unknown): TiptapNode | null {
  return isRecord(value) && typeof value.type === 'string' ? (value as TiptapNode) : null;
}

function inlineTextLength(nodes: unknown): number {
  if (!Array.isArray(nodes)) return 0;

  let length = 0;
  for (const raw of nodes) {
    const node = asNode(raw);
    if (!node) continue;
    if (node.type === 'text' && typeof node.text === 'string') {
      length += node.text.replace(/\u00a0/g, ' ').trim().length;
    } else if (node.type === 'hardBreak') {
      continue;
    } else if (Array.isArray(node.content)) {
      length += inlineTextLength(node.content);
    }
  }

  return length;
}

/** True when inline/block children carry text or non-empty media (e.g. image in paragraph). */
function blockChildrenHaveMeaningfulContent(nodes: unknown): boolean {
  if (!Array.isArray(nodes)) return false;

  for (const raw of nodes) {
    const node = asNode(raw);
    if (!node) continue;
    if (node.type === 'text' && typeof node.text === 'string') {
      if (node.text.replace(/\u00a0/g, ' ').trim().length > 0) return true;
      continue;
    }
    if (node.type === 'hardBreak') continue;
    if (MEANINGFUL_BLOCK_TYPES.has(node.type) && !isEmptyTiptapBlockNode(node)) {
      return true;
    }
    if (Array.isArray(node.content) && blockChildrenHaveMeaningfulContent(node.content)) {
      return true;
    }
  }

  return false;
}

/** True for TipTap/BlockNote blocks with no visible text and no embedded media. */
export function isEmptyTiptapBlockNode(node: unknown): boolean {
  const n = asNode(node);
  if (!n?.type) return true;

  if (MEANINGFUL_BLOCK_TYPES.has(n.type)) {
    if (n.type === 'horizontalRule') return false;
    if (n.type === 'image') {
      return !String(n.attrs?.src ?? '').trim();
    }
    if (n.type === 'codeBlock') {
      return inlineTextLength(n.content ?? []) === 0;
    }
    return false;
  }

  if (n.type === 'bulletList' || n.type === 'orderedList' || n.type === 'taskList') {
    const items = Array.isArray(n.content) ? n.content : [];
    return items.length === 0 || items.every((item) => isEmptyTiptapBlockNode(item));
  }

  if (n.type === 'listItem' || n.type === 'taskItem') {
    const inner = Array.isArray(n.content) ? n.content : [];
    return inner.length === 0 || inner.every((child) => isEmptyTiptapBlockNode(child));
  }

  if (n.type === 'blockquote') {
    const inner = Array.isArray(n.content) ? n.content : [];
    return inner.length === 0 || inner.every((child) => isEmptyTiptapBlockNode(child));
  }

  // paragraph, heading, legacy BlockNote blocks, etc.
  return !blockChildrenHaveMeaningfulContent(n.content ?? []);
}

function toContentArray(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (isRecord(value) && value.type === 'doc' && Array.isArray(value.content)) {
    return value.content;
  }
  return [];
}

/** Atributos que TipTap añade al abrir/guardar y no representan edición del usuario. */
const VOLATILE_NODE_ATTR_KEYS = new Set([
  'colwidth',
  'columnSizing',
  'data-colwidth',
  'width',
  'height',
  'style',
  'class',
  'title',
]);

const IMAGE_COMPARE_ATTR_KEYS = ['src', 'alt'] as const;

function stripTrailingEmptyBlocks(nodes: unknown[]): unknown[] {
  const out = JSON.parse(JSON.stringify(nodes));

  return out;
}

function canonicalizeNodeAttrs(type: string, rawAttrs: unknown): Record<string, unknown> | undefined {
  if (!isRecord(rawAttrs)) return undefined;

  let attrs: Record<string, unknown> = { ...rawAttrs };
  if (type === 'image') {
    const picked: Record<string, unknown> = {};
    for (const key of IMAGE_COMPARE_ATTR_KEYS) {
      const value = attrs[key];
      if (value != null && String(value).trim() !== '') {
        picked[key] = value;
      }
    }
    return Object.keys(picked).length > 0 ? picked : undefined;
  }

  for (const key of VOLATILE_NODE_ATTR_KEYS) {
    delete attrs[key];
  }
  if (type === 'tableCell' && attrs.colspan === 1) delete attrs.colspan;
  if (type === 'tableCell' && attrs.rowspan === 1) delete attrs.rowspan;

  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

/** Canonicalize and drop phantom empty nodes at every depth (cells, list items, etc.). */
function canonicalizeNodeForCompare(node: unknown): unknown | null {
  const n = asNode(node);
  if (!n?.type) return null;

  if (n.type === 'text') {
    const text = typeof n.text === 'string' ? n.text : '';
    const hasMarks = Array.isArray(n.marks) && n.marks.length > 0;
    if (text.replace(/\u00a0/g, ' ').trim() === '' && !hasMarks) {
      return null;
    }
    return {
      type: 'text',
      ...(typeof n.text === 'string' ? { text: n.text } : {}),
      ...(hasMarks ? { marks: n.marks } : {}),
    };
  }

  // TipTap may emit tableHeader where the template stored tableCell.
  const rawType = n.type;
  const type = rawType === 'tableHeader' ? 'tableCell' : rawType;
  const attrs = canonicalizeNodeAttrs(type, n.attrs);

  let content: unknown[] | undefined;
  if (Array.isArray(n.content)) {
    let children = n.content
      .map((child) => canonicalizeNodeForCompare(child))
      .filter((child): child is unknown => child != null);

    if (rawType === 'bulletList' || rawType === 'orderedList' || rawType === 'taskList') {
      children = children.filter((child) => !isEmptyTiptapBlockNode(child));
    }
      
    children = stripTrailingEmptyBlocks(children);
    content = children.length > 0 ? children : undefined;
  }

  const out = {
    type,
    ...(attrs ? { attrs } : {}),
    ...(content !== undefined ? { content } : {}),
  };

  return isEmptyTiptapBlockNode(out) ? null : out;
}

/**
 * Strips trailing empty paragraphs TipTap adds for cursor placement.
 * Preserves the full node tree (text, marks, heading levels) for persistence.
 */
export function normalizeTiptapContentForPersistence(value: unknown): unknown[] {
  const nodes = [...toContentArray(value)];
  while (nodes.length > 0 && isEmptyTiptapBlockNode(nodes[nodes.length - 1])) {
    nodes.pop();
  }
  return nodes;
}

/**
 * Canonical form for semantic diff/compare (strips volatile attrs, trailing empties).
 * Returns a new array; does not mutate the input.
 */
export function normalizeTiptapContentForCompare(value: unknown): unknown[] {
  const nodes = toContentArray(value)
    .map((node) => canonicalizeNodeForCompare(node))
    .filter((node): node is unknown => node != null);

  return stripTrailingEmptyBlocks(nodes);
}

/**
 * True when content has no meaningful text or media (e.g. only `<p></p>` / `paragraph: []`).
 */
export function isSemanticallyEmptyTiptapContent(value: unknown): boolean {
  const nodes = normalizeTiptapContentForCompare(value);
  if (nodes.length === 0) return true;
  return nodes.every((node) => isEmptyTiptapBlockNode(node));
}

export function canonicalTiptapContentJson(value: unknown): string {
  try {
    return JSON.stringify(normalizeTiptapContentForCompare(value));
  } catch {
    return '';
  }
}

export function tiptapContentEquals(a: unknown, b: unknown): boolean {
  return canonicalTiptapContentJson(a) === canonicalTiptapContentJson(b);
}

/**
 * Visible character count of editor HTML (ignores tags). Matches logs comment validation.
 */
export function htmlVisibleTextLength(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
  return text.length;
}

export function isSemanticallyEmptyEditorHtml(html: string): boolean {
  return htmlVisibleTextLength(html) === 0;
}

/** Payload shape for MayaEditor `output="json"`. */
export function normalizeTiptapDocPayload(payload: string | TiptapDoc): string | TiptapDoc {
  if (typeof payload === 'string') return payload;
  return {
    ...payload,
    content: normalizeTiptapContentForPersistence(payload.content) as TiptapDoc['content'],
  };
}
