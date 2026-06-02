import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
// TipTap v3 ships all extensions as named exports (no default exports).
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

import { IframeBlock } from '../extensions/IframeBlock';
import { AlertBlock } from '../extensions/AlertBlock';
import { CommentMark } from '../extensions/CommentMark';
import { Indent } from '../extensions/Indent';
import { useEditorContent, type EditorOutput } from '../hooks/useEditorContent';
import { sanitizeEditorHtml } from '../lib/dompurifyConfig';
import { markdownToHtml } from '../lib/markdownToHtml';
import { htmlToMarkdown } from '../lib/htmlToMarkdown';
import { normalizeTableHtml } from '../lib/normalizeTableHtml';
import type { EditorMode, TiptapDoc } from '../types';
import { EditorToolbar, type ToolbarLabels } from './EditorToolbar';
import '../styles/maya-editor.css';

type ViewMode = 'wysiwyg' | 'html' | 'markdown';

export interface MayaEditorProps {
  /** Initial HTML content (preferred) or a ProseMirror JSON doc. */
  initialContent?: string | object;
  /** When false, the editor is read-only. Defaults to true. */
  editable?: boolean;
  /** Toggle dark-mode CSS class on the editor wrapper. */
  isDark?: boolean;
  /** Editor mode: 'lite' (minimal toolbar) | 'full' (BlockNote parity). */
  mode?: EditorMode;
  /** Debounced change callback (300ms). Payload depends on `output`. */
  onChange?: (payload: string | TiptapDoc) => void;
  /**
   * Output shape: `'html'` (default) emits a sanitisation-ready string;
   * `'json'` emits the full ProseMirror doc `{type:'doc', content:[…]}`,
   * structurally equivalent to BlockNote's legacy block array and a
   * better fit for backends that still validate as JSON object/array.
   */
  output?: EditorOutput;
  /** Fullscreen toggle callback (only meaningful in 'full' mode). */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** Optional file uploader; returns the URL to embed. */
  uploadFile?: (file: File) => Promise<string>;
  /** Optional toolbar labels override (i18n). */
  toolbarLabels?: ToolbarLabels;
  /** Optional placeholder text. */
  placeholder?: string;
  /** Forwarded onEditorReady callback to access the underlying editor. */
  onEditorReady?: (editor: Editor) => void;
}

/**
 * Unified TipTap editor for the Maya ecosystem.
 *
 * Two visual modes via the `mode` prop — the underlying ProseMirror
 * schema and extensions are shared, so a `mode=lite` instance can be
 * upgraded to `mode=full` without re-parsing content.
 *
 * Intended replacements:
 *   - `mode='lite'`  → 4 textareas in maya_logs + maya_dashboard
 *   - `mode='full'`  → BlockNoteEditorPanel in maya_dms (templates/documents)
 */
export function MayaEditor({
  initialContent,
  editable = true,
  isDark = false,
  mode = 'lite',
  onChange,
  onFullscreenChange,
  uploadFile: _uploadFile, // reserved for Fase 9
  toolbarLabels,
  placeholder,
  onEditorReady,
  output,
}: MayaEditorProps) {
  const effectiveOutput: EditorOutput = output ?? (mode === 'full' ? 'json' : 'html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  const [sourceText, setSourceText] = useState('');

  const extensions = useMemo(() => {
    const base = [
      StarterKit.configure({
        // We bring our own list/table/image extensions.
        // Keep history, hardBreak, dropcursor, gapcursor, paragraph, heading, etc.
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
        IframeBlock,
        AlertBlock,
      );
    }
    return base;
  }, [mode]);

  const editor = useEditor({
    extensions,
    content: initialContent ?? '',
    editable,
    editorProps: {
      attributes: {
        class: `maya-editor maya-editor--${mode}${isDark ? ' is-dark' : ''}`,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
      // Reshape pasted HTML so complex tables (caption/tfoot/colgroup)
      // survive TipTap's parser. See `normalizeTableHtml` for details.
      transformPastedHTML: (html) => normalizeTableHtml(html),
    },
  });

  useEditorContent(editor, onChange, { output: effectiveOutput });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!onFullscreenChange) return;
    onFullscreenChange(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  if (!editor) return null;

  const enterSource = (target: 'html' | 'markdown') => {
    const currentHtml = editor.getHTML();
    const text = target === 'html' ? currentHtml : htmlToMarkdown(currentHtml);
    setSourceText(text);
    setViewMode(target);
  };

  const exitSource = () => {
    const rawHtml =
      viewMode === 'markdown'
        ? markdownToHtml(sourceText)
        : sourceText;
    // Normalise complex tables (caption/tfoot/colgroup) before sanitising
    // — DOMPurify only strips disallowed tags, it doesn't reshape the
    // tree to match TipTap's schema.
    const html = sanitizeEditorHtml(normalizeTableHtml(rawHtml));
    if (editor && html != null) {
      editor.commands.setContent(html, { emitUpdate: true });
    }
    setViewMode('wysiwyg');
  };

  const toggleHtml = () => {
    if (viewMode === 'html') exitSource();
    else if (viewMode === 'markdown') {
      // markdown → html (switch source flavour without round-tripping the editor)
      const html = sanitizeEditorHtml(markdownToHtml(sourceText));
      setSourceText(html);
      setViewMode('html');
    } else enterSource('html');
  };

  const toggleMarkdown = () => {
    if (viewMode === 'markdown') exitSource();
    else if (viewMode === 'html') {
      const md = htmlToMarkdown(sourceText);
      setSourceText(md);
      setViewMode('markdown');
    } else enterSource('markdown');
  };

  return (
    <div
      className={`maya-editor-wrapper${isFullscreen ? ' is-fullscreen' : ''}${isDark ? ' is-dark' : ''}`}
    >
      <EditorToolbar
        editor={editor}
        mode={mode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={
          mode === 'full' ? () => setIsFullscreen((v) => !v) : undefined
        }
        onInsertHtml={mode === 'full' ? toggleHtml : undefined}
        onInsertMarkdown={mode === 'full' ? toggleMarkdown : undefined}
        viewMode={viewMode}
        labels={toolbarLabels}
      />
      {viewMode === 'wysiwyg' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          className="maya-editor-source"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          spellCheck={false}
          aria-label={
            viewMode === 'html'
              ? (toolbarLabels?.insertHtml ?? 'HTML source')
              : (toolbarLabels?.insertMarkdown ?? 'Markdown source')
          }
        />
      )}
    </div>
  );
}
