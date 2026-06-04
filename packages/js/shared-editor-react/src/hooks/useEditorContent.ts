import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { TiptapDoc } from '../types';
import {
  canonicalTiptapContentJson,
  isSemanticallyEmptyEditorHtml,
  normalizeTiptapDocPayload,
} from '../lib/tiptapContentSemantics';

export type EditorOutput = 'html' | 'json';

/**
 * Debounced onChange wiring for a TipTap editor instance.
 *
 * The payload shape is selected by `output`:
 *   - 'html' (default for `<MayaEditor mode="lite">`) — string HTML, fed
 *     straight to a sanitiser before persistence.
 *   - 'json' (default for `<MayaEditor mode="full">`) — full ProseMirror
 *     doc object `{ type: 'doc', content: [...] }`, structurally equivalent
 *     to BlockNote's legacy block array so backends that stored BlockNote
 *     JSON can keep their `array | object` validation rules.
 */
export function useEditorContent(
  editor: Editor | null,
  onChange: ((payload: string | TiptapDoc) => void) | undefined,
  options: { output?: EditorOutput; delayMs?: number } = {},
): void {
  const { output = 'html', delayMs = 300 } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;
  const lastEmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    lastEmittedRef.current = null;

    const handleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const rawPayload = output === 'json'
          ? (editor.getJSON() as TiptapDoc)
          : editor.getHTML();
        const payload = output === 'json'
          ? normalizeTiptapDocPayload(rawPayload)
          : rawPayload;

        const fingerprint = output === 'json'
          ? canonicalTiptapContentJson((payload as TiptapDoc).content)
          : payload;

        if (typeof fingerprint === 'string' && fingerprint === lastEmittedRef.current) {
          return;
        }

        if (output === 'html' && typeof payload === 'string' && isSemanticallyEmptyEditorHtml(payload)) {
          if (lastEmittedRef.current === '') return;
          lastEmittedRef.current = '';
          handlerRef.current?.(payload);
          return;
        }

        lastEmittedRef.current = typeof fingerprint === 'string' ? fingerprint : null;
        handlerRef.current?.(payload);
      }, delayMs);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editor, delayMs, output]);
}
