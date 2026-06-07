/**
 * Table editing actions exposed by the contextual table toolbar.
 *
 * Pure mapping from an editor instance + labels to a flat, ordered list of
 * buttons. Kept separate from the React component so the command wiring and
 * `can()` gating can be unit-tested against a headless editor.
 */
import type { Editor } from '@tiptap/core';
import type { ToolbarLabels } from '../components/EditorToolbar';

export interface TableMenuAction {
  /** Stable key for React lists. */
  key: string;
  /** Tooltip / aria-label. */
  title: string;
  /** Compact glyph shown on the button. */
  icon: string;
  /** Runs the command. */
  run: () => void;
  /** True when the command can't apply to the current selection. */
  disabled: boolean;
  /** When true, render a visual separator before this action. */
  separatorBefore?: boolean;
}

/**
 * Build the ordered list of table actions for the current editor state.
 * Recomputed on every render so `disabled` reflects the live selection.
 */
export function tableMenuActions(
  editor: Editor,
  labels?: Partial<ToolbarLabels>,
): TableMenuAction[] {
  const L = labels ?? {};
  const chain = () => editor.chain().focus();

  return [
    {
      key: 'addColumnBefore',
      title: L.tableAddColumnBefore ?? 'Insert column left',
      icon: '⊞◀',
      run: () => chain().addColumnBefore().run(),
      disabled: !editor.can().addColumnBefore(),
    },
    {
      key: 'addColumnAfter',
      title: L.tableAddColumnAfter ?? 'Insert column right',
      icon: '⊞▶',
      run: () => chain().addColumnAfter().run(),
      disabled: !editor.can().addColumnAfter(),
    },
    {
      key: 'addRowBefore',
      title: L.tableAddRowBefore ?? 'Insert row above',
      icon: '⊞▲',
      run: () => chain().addRowBefore().run(),
      disabled: !editor.can().addRowBefore(),
      separatorBefore: true,
    },
    {
      key: 'addRowAfter',
      title: L.tableAddRowAfter ?? 'Insert row below',
      icon: '⊞▼',
      run: () => chain().addRowAfter().run(),
      disabled: !editor.can().addRowAfter(),
    },
    {
      key: 'deleteColumn',
      title: L.tableDeleteColumn ?? 'Delete column',
      icon: '✕│',
      run: () => chain().deleteColumn().run(),
      disabled: !editor.can().deleteColumn(),
      separatorBefore: true,
    },
    {
      key: 'deleteRow',
      title: L.tableDeleteRow ?? 'Delete row',
      icon: '✕─',
      run: () => chain().deleteRow().run(),
      disabled: !editor.can().deleteRow(),
    },
    {
      key: 'toggleHeaderRow',
      title: L.tableToggleHeaderRow ?? 'Toggle header row',
      icon: '⊤',
      run: () => chain().toggleHeaderRow().run(),
      disabled: !editor.can().toggleHeaderRow(),
      separatorBefore: true,
    },
    {
      key: 'deleteTable',
      title: L.tableDelete ?? 'Delete table',
      icon: '🗑',
      run: () => chain().deleteTable().run(),
      disabled: !editor.can().deleteTable(),
    },
  ];
}
