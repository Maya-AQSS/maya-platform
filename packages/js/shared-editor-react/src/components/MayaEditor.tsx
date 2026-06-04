import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

import { buildMayaEditorExtensions } from '../lib/editorExtensions';
import { isEditorReady } from '../lib/isEditorReady';
import { useEditorContent, type EditorOutput } from '../hooks/useEditorContent';
import { sanitizeEditorHtml } from '../lib/dompurifyConfig';
import { markdownToHtml } from '../lib/markdownToHtml';
import { htmlToMarkdown } from '../lib/htmlToMarkdown';
import { normalizeTableHtml } from '../lib/normalizeTableHtml';
import { docxToHtml } from '../lib/docxToHtml';
import type { EditorMode, TiptapDoc } from '../types';
import { EditorToolbar, type ToolbarLabels } from './EditorToolbar';
import { FindReplaceBar } from './FindReplaceBar';
import { CommentHoverPopover, type CommentHoverData } from './CommentHoverPopover';
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
  /**
   * Called when the user clicks "Comment selection". Receives the current
   * text range. The consumer should persist the comment, then return the
   * commentId — the editor wraps the selection with a `CommentMark`
   * carrying that id. Returning `null`/`undefined` cancels.
   */
  onCreateComment?: (range: {
    from: number;
    to: number;
    text: string;
  }) => Promise<string | number | null | undefined> | string | number | null | undefined;
  /** Called when the user clicks "Export .docx". Consumer triggers the download. */
  onExportDocx?: () => void;
  /**
   * Lookup table for anchored-comment hover previews. The package itself
   * doesn't know how comments are fetched — the consumer passes a dict
   * keyed by `commentId` so the editor can render a `data-comment-id`
   * span's contents in a portal popover on hover. Missing keys → no
   * popover (silent).
   */
  commentsById?: Record<string, CommentHoverData>;
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
  uploadFile,
  toolbarLabels,
  placeholder,
  onEditorReady,
  output,
  onCreateComment,
  onExportDocx,
  commentsById,
}: MayaEditorProps) {
  const effectiveOutput: EditorOutput = output ?? (mode === 'full' ? 'json' : 'html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  const [sourceText, setSourceText] = useState('');
  const [findOpen, setFindOpen] = useState(false);
  // selectionVersion bumps on every selectionUpdate so toolbar predicates
  // that read `editor.state.selection` (e.g. the comment button's disabled
  // state) re-evaluate on cursor moves. TipTap v3's `useEditor` re-renders
  // on transactions but not selection-only changes.
  const [, setSelectionVersion] = useState(0);
  const [hoveredComment, setHoveredComment] = useState<{
    id: string;
    rect: DOMRect;
  } | null>(null);
  // viewReady flips to true after TipTap's `create` event fires, which is
  // when `editor.view` becomes safely accessible. Used to defer effects
  // that touch the view DOM until it's actually mounted.
  const [viewReady, setViewReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo(() => buildMayaEditorExtensions(mode), [mode]);

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
    setViewReady(false);
    if (!editor) return;

    const bump = () => {
      if (!isEditorReady(editor)) return;
      setSelectionVersion((v) => v + 1);
    };
    const markReady = () => setViewReady(true);
    const markNotReady = () => setViewReady(false);

    editor.on('selectionUpdate', bump);
    editor.on('transaction', bump);
    editor.on('create', markReady);
    editor.on('destroy', markNotReady);

    try {
      if (editor.view?.dom) setViewReady(true);
    } catch {
      /* view not ready yet — markReady will fire on create */
    }

    return () => {
      editor.off('selectionUpdate', bump);
      editor.off('transaction', bump);
      editor.off('create', markReady);
      editor.off('destroy', markNotReady);
      setViewReady(false);
    };
  }, [editor]);

  // Hover detection on CommentMark spans (`data-comment-id`).
  // Listens on the editor view DOM so we don't pay for delegated mouse
  // events outside the editor surface. Closes when the pointer leaves
  // the comment span and there's no replacement inside the same hover.
  // Gated on `viewReady` because `editor.view` is a getter that throws
  // until TipTap fires the `create` event.
  useEffect(() => {
    if (!editor || !commentsById || !viewReady) return;
    let root: HTMLElement;
    try {
      root = editor.view.dom as HTMLElement;
    } catch {
      return;
    }
    if (!root) return;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const span = target?.closest?.('[data-comment-id]') as HTMLElement | null;
      if (!span) return;
      const id = span.getAttribute('data-comment-id');
      if (!id || !commentsById[id]) return;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      setHoveredComment({ id, rect: span.getBoundingClientRect() });
    };
    const handleLeave = (e: MouseEvent) => {
      const target = e.relatedTarget as HTMLElement | null;
      if (target && target.closest?.('[data-comment-id]')) return;
      if (target && target.closest?.('.maya-comment-popover')) return;
      hideTimer = setTimeout(() => setHoveredComment(null), 80);
    };

    root.addEventListener('mouseover', handleEnter);
    root.addEventListener('mouseout', handleLeave);
    return () => {
      root.removeEventListener('mouseover', handleEnter);
      root.removeEventListener('mouseout', handleLeave);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [editor, commentsById, viewReady]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!onFullscreenChange) return;
    onFullscreenChange(isFullscreen);
  }, [isFullscreen, onFullscreenChange]);

  if (!editor) return null;

  const editorReady = viewReady && isEditorReady(editor);

  const handlePickImage = async (file: File) => {
    if (!uploadFile) return;
    try {
      const url = await uploadFile(file);
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (e) {
      // Surface as console only — the upstream uploader is expected to
      // show its own toast/error UI.
      console.error('[MayaEditor] image upload failed', e);
    }
  };

  const handlePickDocx = async (file: File) => {
    try {
      const html = await docxToHtml(file);
      editor.commands.setContent(html, { emitUpdate: true });
    } catch (e) {
      console.error('[MayaEditor] docx import failed', e);
    }
  };

  const handleCommentSelection = async () => {
    if (!onCreateComment) return;
    const { from, to } = editor.state.selection;
    if (to <= from) return;
    const text = editor.state.doc.textBetween(from, to, ' ');
    const id = await Promise.resolve(onCreateComment({ from, to, text }));
    if (id == null) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setComment(id)
      .run();
  };

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
      {editorReady && (
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
        onImage={mode === 'full' && uploadFile ? () => fileInputRef.current?.click() : undefined}
        onImportDocx={mode === 'full' ? () => docxInputRef.current?.click() : undefined}
        onExportDocx={mode === 'full' && onExportDocx ? onExportDocx : undefined}
        onAddComment={mode === 'full' && onCreateComment ? handleCommentSelection : undefined}
        onToggleFind={mode === 'full' ? () => setFindOpen((v) => !v) : undefined}
        labels={toolbarLabels}
      />
      )}
      {mode === 'full' && editorReady && (
        <FindReplaceBar
          editor={editor}
          open={findOpen}
          onClose={() => setFindOpen(false)}
          labels={{
            findPlaceholder: toolbarLabels?.findPlaceholder ?? 'Find',
            replacePlaceholder: toolbarLabels?.replacePlaceholder ?? 'Replace with',
            findNext: toolbarLabels?.findNext ?? 'Next match',
            findPrev: toolbarLabels?.findPrev ?? 'Previous match',
            replace: toolbarLabels?.replace ?? 'Replace',
            replaceAll: toolbarLabels?.replaceAll ?? 'Replace all',
            close: toolbarLabels?.findClose ?? 'Close',
            caseSensitive: toolbarLabels?.caseSensitive ?? 'Match case',
            count: (a, b) => `${a}/${b}`,
            none: toolbarLabels?.findNone ?? 'No matches',
            replacedCount: (n) => `${n} replaced`,
          }}
        />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="maya-editor-hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePickImage(f);
          e.target.value = '';
        }}
      />
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="maya-editor-hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePickDocx(f);
          e.target.value = '';
        }}
      />
      <CommentHoverPopover
        comment={hoveredComment && commentsById ? commentsById[hoveredComment.id] ?? null : null}
        anchorRect={hoveredComment?.rect ?? null}
        isDark={isDark}
      />
      {viewMode === 'wysiwyg' ? (
        <EditorContent editor={editor} className="maya-editor-content" />
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
