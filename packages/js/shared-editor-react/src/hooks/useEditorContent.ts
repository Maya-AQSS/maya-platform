import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { TiptapDoc } from '../types';

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

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const payload = output === 'json'
          ? (editor.getJSON() as TiptapDoc)
          : editor.getHTML();
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
