import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';

/**
 * Debounced onChange wiring for a TipTap editor instance.
 *
 * Calls `onChange(html)` 300ms after the last edit, so React state
 * updates and persistence calls don't fire on every keystroke.
 */
export function useEditorContent(
  editor: Editor | null,
  onChange: ((html: string) => void) | undefined,
  delayMs: number = 300,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(onChange);
  handlerRef.current = onChange;

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        handlerRef.current?.(html);
      }, delayMs);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editor, delayMs]);
}
