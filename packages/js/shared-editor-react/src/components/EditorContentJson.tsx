import { useMemo } from 'react';

import { renderTiptapJsonToHtml } from '../lib/renderTiptapJson';
import { EditorContentHtml } from './EditorContentHtml';
import type { TiptapDoc, TiptapNode } from '../types';

interface EditorContentJsonProps {
  /**
   * Stored TipTap content — a wrapped doc (`{ type: 'doc', content }`) or the
   * bare content array that `MayaEditor` emits and the backend persists.
   */
  content: TiptapDoc | TiptapNode[] | unknown;
  className?: string;
}

/**
 * Read-only renderer for stored TipTap JSON. Renders via TipTap's static
 * renderer (single source of truth with the editor schema) and sanitises the
 * result through `EditorContentHtml` (DOMPurify).
 *
 * Use this instead of hand-rolled JSON→HTML walkers. For pre-rendered HTML
 * strings (e.g. server-side `TiptapHtmlRenderer` output) use
 * `EditorContentHtml` directly.
 */
export function EditorContentJson({ content, className }: EditorContentJsonProps) {
  const html = useMemo(() => renderTiptapJsonToHtml(content), [content]);
  if (!html) return null;
  return <EditorContentHtml html={html} className={className} />;
}
