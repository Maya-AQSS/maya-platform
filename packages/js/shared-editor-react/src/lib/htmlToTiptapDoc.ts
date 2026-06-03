/**
 * Convert sanitised HTML to a ProseMirror/TipTap JSON doc using a headless
 * editor configured with the Maya editor extensions, so the round-trip
 * matches exactly what the live editor persists.
 *
 * Callers may pass their own `extensions` (e.g. a `mode='lite'` list); when
 * omitted, the canonical `full` schema is used. The headless editor is
 * created detached and destroyed before returning — no DOM node is mounted.
 */
import { Editor } from '@tiptap/core';
import type { Extensions } from '@tiptap/core';

import { buildMayaEditorExtensions } from './editorExtensions';
import type { TiptapDoc } from '../types';

export function htmlToTiptapDoc(html: string, extensions?: Extensions): TiptapDoc {
  const editor = new Editor({
    content: html ?? '',
    extensions: extensions ?? buildMayaEditorExtensions('full'),
  });
  try {
    return editor.getJSON() as TiptapDoc;
  } finally {
    editor.destroy();
  }
}
