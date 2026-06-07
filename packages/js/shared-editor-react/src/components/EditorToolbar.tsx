import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';
import { Btn } from './EditorToolbarButton';
import { EditorIcon } from './EditorIcons';
import {
  FormattingButtons,
  AdvancedFormattingButtons,
  AlignmentButtons,
  IndentButtons,
  HeadingButtons,
  ListAndBlockButtons,
  TableAndMediaButtons,
  TableButtons,
  DocumentButtons,
  ViewModeButtons,
} from './EditorToolbarGroups';

interface EditorToolbarProps {
  editor: Editor | null;
  mode: EditorMode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onInsertHtml?: () => void;
  onInsertMarkdown?: () => void;
  viewMode?: 'wysiwyg' | 'html' | 'markdown';
  onImage?: () => void;
  onImportDocx?: () => void;
  onExportDocx?: () => void;
  onAddComment?: () => void;
  onToggleFind?: () => void;
  labels?: ToolbarLabels;
}

export interface ToolbarLabels {
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  link: string;
  linkPrompt: string;
  unlink: string;
  heading1: string;
  heading2: string;
  heading3: string;
  bulletList: string;
  orderedList: string;
  taskList: string;
  blockquote: string;
  codeBlock: string;
  horizontalRule: string;
  image: string;
  table: string;
  alert: string;
  iframe: string;
  iframePrompt: string;
  fullscreen: string;
  exitFullscreen: string;
  insertHtml: string;
  insertMarkdown: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  alignJustify: string;
  indent: string;
  outdent: string;
  textColor: string;
  backgroundColor: string;
  colorDefault: string;
  undo: string;
  redo: string;
  uploadImage: string;
  importDocx: string;
  exportDocx: string;
  addComment: string;
  find: string;
  findPlaceholder?: string;
  replacePlaceholder?: string;
  findNext?: string;
  findPrev?: string;
  replace?: string;
  replaceAll?: string;
  findClose?: string;
  caseSensitive?: string;
  findNone?: string;
  tableAddColumnBefore?: string;
  tableAddColumnAfter?: string;
  tableAddRowBefore?: string;
  tableAddRowAfter?: string;
  tableDeleteColumn?: string;
  tableDeleteRow?: string;
  tableToggleHeaderRow?: string;
  tableDelete?: string;
  groupHistory?: string;
  groupFont?: string;
  groupParagraph?: string;
  groupStyles?: string;
  groupInsert?: string;
  groupTable?: string;
  groupTools?: string;
  groupView?: string;
}

export const DEFAULT_LABELS: ToolbarLabels = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strike',
  code: 'Code',
  link: 'Link',
  linkPrompt: 'URL',
  unlink: 'Unlink',
  heading1: 'H1',
  heading2: 'H2',
  heading3: 'H3',
  bulletList: 'Bullet list',
  orderedList: 'Numbered list',
  taskList: 'Task list',
  blockquote: 'Quote',
  codeBlock: 'Code block',
  horizontalRule: 'HR',
  image: 'Image',
  table: 'Table',
  alert: 'Alert',
  iframe: 'Iframe',
  iframePrompt: 'Iframe URL',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
  insertHtml: 'Insert HTML',
  insertMarkdown: 'Insert Markdown',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  alignJustify: 'Justify',
  indent: 'Increase indent',
  outdent: 'Decrease indent',
  textColor: 'Text color',
  backgroundColor: 'Highlight color',
  colorDefault: 'Default color',
  undo: 'Undo',
  redo: 'Redo',
  uploadImage: 'Insert image',
  importDocx: 'Import Word (.docx)',
  exportDocx: 'Export Word (.docx)',
  addComment: 'Comment selection',
  find: 'Find and replace',
  findPlaceholder: 'Find',
  replacePlaceholder: 'Replace with',
  findNext: 'Next match',
  findPrev: 'Previous match',
  replace: 'Replace',
  replaceAll: 'Replace all',
  findClose: 'Close find',
  caseSensitive: 'Match case',
  findNone: 'No matches',
  tableAddColumnBefore: 'Insert column left',
  tableAddColumnAfter: 'Insert column right',
  tableAddRowBefore: 'Insert row above',
  tableAddRowAfter: 'Insert row below',
  tableDeleteColumn: 'Delete column',
  tableDeleteRow: 'Delete row',
  tableToggleHeaderRow: 'Toggle header row',
  tableDelete: 'Delete table',
  groupHistory: 'History',
  groupFont: 'Font',
  groupParagraph: 'Paragraph',
  groupStyles: 'Styles',
  groupInsert: 'Insert',
  groupTable: 'Table',
  groupTools: 'Tools',
  groupView: 'View',
};

/**
 * EditorToolbar is a wrapper component that composes focused button groups.
 * Each group handles a logically distinct set of toolbar buttons, keeping
 * individual files under the 400-line target per coding-style.md.
 */
export function EditorToolbar({
  editor,
  mode,
  isFullscreen,
  onToggleFullscreen,
  onInsertHtml,
  onInsertMarkdown,
  viewMode = 'wysiwyg',
  onImage,
  onImportDocx,
  onExportDocx,
  onAddComment,
  onToggleFind,
  labels,
}: EditorToolbarProps) {
  if (!editor) return null;
  const L = labels ?? DEFAULT_LABELS;

  const isLite = mode === 'lite';

  // Lite mode: a single flat row (no captions), as before.
  if (isLite) {
    return (
      <div className="maya-editor-toolbar" role="toolbar" aria-label="Editor toolbar">
        <Btn
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          title={L.undo}
        >
          <EditorIcon name="undo" />
        </Btn>
        <Btn
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title={L.redo}
        >
          <EditorIcon name="redo" />
        </Btn>
        <span className="maya-editor-toolbar__sep" aria-hidden />
        <FormattingButtons editor={editor} labels={L} />
      </div>
    );
  }

  // Full mode: Word-style ribbon — each group is captioned and separated.
  return (
    <div
      className="maya-editor-toolbar maya-editor-ribbon"
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <RibbonGroup label={L.groupHistory ?? 'History'}>
        <Btn
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          title={L.undo}
        >
          <EditorIcon name="undo" />
        </Btn>
        <Btn
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          title={L.redo}
        >
          <EditorIcon name="redo" />
        </Btn>
      </RibbonGroup>

      <RibbonGroup label={L.groupFont ?? 'Font'}>
        <FormattingButtons editor={editor} labels={L} />
        <AdvancedFormattingButtons editor={editor} labels={L} />
      </RibbonGroup>

      <RibbonGroup label={L.groupParagraph ?? 'Paragraph'}>
        <AlignmentButtons editor={editor} labels={L} />
        <span className="maya-editor-toolbar__sep" aria-hidden />
        <IndentButtons editor={editor} labels={L} />
        <span className="maya-editor-toolbar__sep" aria-hidden />
        <ListAndBlockButtons editor={editor} labels={L} />
      </RibbonGroup>

      <RibbonGroup label={L.groupStyles ?? 'Styles'}>
        <HeadingButtons editor={editor} labels={L} />
      </RibbonGroup>

      <RibbonGroup label={L.groupInsert ?? 'Insert'}>
        <TableAndMediaButtons editor={editor} labels={L} onImage={onImage} />
      </RibbonGroup>

      {editor.isActive('table') && (
        <RibbonGroup label={L.groupTable ?? 'Table'}>
          <TableButtons editor={editor} labels={L} />
        </RibbonGroup>
      )}

      <RibbonGroup label={L.groupTools ?? 'Tools'}>
        <DocumentButtons
          editor={editor}
          labels={L}
          onImportDocx={onImportDocx}
          onExportDocx={onExportDocx}
          onAddComment={onAddComment}
          onToggleFind={onToggleFind}
        />
      </RibbonGroup>

      <RibbonGroup label={L.groupView ?? 'View'}>
        <ViewModeButtons
          editor={editor}
          labels={L}
          viewMode={viewMode}
          isFullscreen={isFullscreen}
          onInsertHtml={onInsertHtml}
          onInsertMarkdown={onInsertMarkdown}
          onToggleFullscreen={onToggleFullscreen}
        />
      </RibbonGroup>
    </div>
  );
}

/**
 * One captioned ribbon section: a row of buttons with a small grey label
 * beneath, mirroring Word's ribbon groups (Font, Paragraph, …).
 */
function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="maya-editor-ribbon-group">
      <div className="maya-editor-ribbon-group__row">{children}</div>
      <div className="maya-editor-ribbon-group__label">{label}</div>
    </div>
  );
}
