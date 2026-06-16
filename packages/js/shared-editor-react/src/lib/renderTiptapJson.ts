/**
 * Render a stored TipTap/ProseMirror JSON document to an HTML string using
 * TipTap's official static renderer.
 *
 * This replaces hand-rolled JSON→HTML walkers (which drift from the live
 * editor and from the server-side `TiptapHtmlRenderer.php`). The static
 * renderer builds the schema from the canonical extension set and runs each
 * extension's `renderHTML`, so custom nodes (AlertBlock, …) and
 * marks render exactly as the editor defines them — a single source of truth
 * on the JS side.
 *
 * The returned HTML is NOT sanitised; pass it through `EditorContentHtml`
 * (DOMPurify) or use the `EditorContentJson` component for read-only views.
 *
 * Accepts both shapes persisted by the platform:
 *  - a wrapped doc `{ type: 'doc', content: [...] }`
 *  - a bare content array (`MayaEditor` emits `onChange(doc.content)`)
 *
 * Static-renderer caveats (per TipTap docs): no editor instance is created, so
 * `addProseMirrorPlugins`/`onCreate`/transaction hooks do not run, and the
 * output can differ slightly from the live editor for nodeView-backed nodes.
 */
import { renderToHTMLString } from '@tiptap/static-renderer';
import type { Extensions } from '@tiptap/core';

import { buildMayaEditorExtensions } from './editorExtensions';
import type { TiptapDoc, TiptapNode } from '../types';

function looksLikeTiptapDoc(value: unknown): value is TiptapDoc {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === 'doc' &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

function looksLikeTiptapContentArray(value: unknown): value is TiptapNode[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((n) => !!n && typeof n === 'object')
  );
}

/** Normalise the accepted input shapes to a wrapped doc, or `null` if empty. */
function toDoc(content: unknown): TiptapDoc | null {
  if (content == null) return null;
  if (looksLikeTiptapDoc(content)) return content;
  if (looksLikeTiptapContentArray(content)) {
    return { type: 'doc', content };
  }
  return null;
}

export function renderTiptapJsonToHtml(
  content: TiptapDoc | TiptapNode[] | unknown,
  extensions?: Extensions,
): string {
  const doc = toDoc(content);
  if (!doc) return '';

  try {
    return renderToHTMLString({
      content: doc,
      extensions: extensions ?? buildMayaEditorExtensions('full'),
    });
  } catch {
    return '';
  }
}
