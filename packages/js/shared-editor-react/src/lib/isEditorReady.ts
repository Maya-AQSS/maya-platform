import type { Editor } from '@tiptap/react';

/**
 * TipTap puede exponer una instancia con `commandManager === null` tras destroy
 * o antes del evento `create`. Solo la UI que invoca comandos debe usar esto.
 */
export function isEditorReady(editor: Editor | null | undefined): editor is Editor {
  if (!editor) {
    return false;
  }

  return !editor.isDestroyed;
}
