/**
 * Canonical TipTap extension list for the Maya editor.
 *
 * Extracted from `MayaEditor` so the exact same schema can be reused outside
 * the React component — e.g. by `htmlToTiptapDoc`, which spins up a headless
 * editor and must produce JSON identical to what the live editor persists.
 *
 * Keep this the single source of truth: `MayaEditor` consumes it too.
 */
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import type { Extensions } from '@tiptap/core';

import { AlertBlock } from '../extensions/AlertBlock';
import { CommentMark } from '../extensions/CommentMark';
import { Indent } from '../extensions/Indent';
import type { EditorMode } from '../types';

export function buildMayaEditorExtensions(mode: EditorMode = 'full'): Extensions {
  const base: Extensions = [
    // StarterKit v3 already bundles Link + Underline (and other marks).
    // Disable both so we can add our customised versions without
    // tripping "Duplicate extension names" warnings.
    StarterKit.configure({
      link: false,
      underline: false,
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ['http', 'https', 'mailto', 'tel'],
      HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    CommentMark,
  ];
  if (mode === 'full') {
    base.push(
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Indent,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      AlertBlock,
    );
  }
  return base;
}
