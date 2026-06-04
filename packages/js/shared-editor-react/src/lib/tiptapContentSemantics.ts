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
  return inlineTextLength(n.content ?? []) === 0;
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
]);

function canonicalizeNodeForCompare(node: unknown): unknown {
  const n = asNode(node);
  if (!n?.type) return node;

  let attrs = isRecord(n.attrs) ? { ...n.attrs } : undefined;
  if (attrs) {
    for (const key of VOLATILE_NODE_ATTR_KEYS) {
      delete attrs[key];
    }
    if (Object.keys(attrs).length === 0) attrs = undefined;
  }

  const content = Array.isArray(n.content)
    ? n.content.map(canonicalizeNodeForCompare)
    : n.content;

  return { ...n, ...(attrs ? { attrs } : {}), content };
}

/**
 * Strips trailing empty paragraphs TipTap adds for cursor placement.
 * Returns a new array; does not mutate the input.
 */
export function normalizeTiptapContentForCompare(value: unknown): unknown[] {
  const nodes = [...toContentArray(value)].map(canonicalizeNodeForCompare);
  while (nodes.length > 0 && isEmptyTiptapBlockNode(nodes[nodes.length - 1])) {
    nodes.pop();
  }
  return nodes;
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
    content: normalizeTiptapContentForCompare(payload.content) as TiptapDoc['content'],
  };
}
