import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { buildMayaEditorExtensions } from './editorExtensions';
import { tableMenuActions } from './tableMenuActions';

function makeEditor(): Editor {
  return new Editor({ extensions: buildMayaEditorExtensions('full') });
}

/** Count tableRow / cell nodes in the current doc. */
function tableShape(editor: Editor): { rows: number; cols: number } {
  let rows = 0;
  let cols = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'tableRow') {
      rows += 1;
      if (rows === 1) cols = node.childCount; // cells in first row
    }
    return true;
  });
  return { rows, cols };
}

let current: Editor | null = null;
afterEach(() => {
  current?.destroy();
  current = null;
});

describe('tableMenuActions', () => {
  it('returns all actions disabled when the selection is not in a table', () => {
    const editor = (current = makeEditor());
    editor.commands.setContent('<p>plain paragraph</p>');
    const actions = tableMenuActions(editor);
    expect(actions.length).toBe(8);
    expect(actions.every((a) => a.disabled)).toBe(true);
  });

  it('enables actions and adds a column when the cursor is inside a table', () => {
    const editor = (current = makeEditor());
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    const before = tableShape(editor);

    const addCol = tableMenuActions(editor).find((a) => a.key === 'addColumnAfter')!;
    expect(addCol.disabled).toBe(false);
    addCol.run();

    expect(tableShape(editor).cols).toBe(before.cols + 1);
  });

  it('adds a row', () => {
    const editor = (current = makeEditor());
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    const before = tableShape(editor);

    tableMenuActions(editor).find((a) => a.key === 'addRowAfter')!.run();

    expect(tableShape(editor).rows).toBe(before.rows + 1);
  });

  it('deletes a column', () => {
    const editor = (current = makeEditor());
    editor.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: true }).run();
    const before = tableShape(editor);

    tableMenuActions(editor).find((a) => a.key === 'deleteColumn')!.run();

    expect(tableShape(editor).cols).toBe(before.cols - 1);
  });

  it('deletes the whole table', () => {
    const editor = (current = makeEditor());
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    expect(editor.isActive('table')).toBe(true);

    tableMenuActions(editor).find((a) => a.key === 'deleteTable')!.run();

    expect(editor.isActive('table')).toBe(false);
  });

  it('uses provided labels for tooltips', () => {
    const editor = (current = makeEditor());
    editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
    const actions = tableMenuActions(editor, { tableAddColumnAfter: 'Insertar columna a la derecha' });
    const addCol = actions.find((a) => a.key === 'addColumnAfter')!;
    expect(addCol.title).toBe('Insertar columna a la derecha');
  });
});
