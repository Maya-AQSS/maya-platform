/**
 * EditorToolbar button groups extracted into focused subcomponents.
 * Each group handles a logically distinct set of formatting or block operations.
 */
import type { Editor } from '@tiptap/react';
import type { ToolbarLabels } from './EditorToolbar';
import { ColorPicker } from './ColorPicker';
import { Btn } from './EditorToolbarButton';

export interface ToolbarGroupProps {
  editor: Editor;
  labels: ToolbarLabels;
}

/**
 * Basic formatting: bold, italic, underline, code, link.
 * Always visible, even in lite mode.
 */
export function FormattingButtons({ editor, labels: L }: ToolbarGroupProps) {
  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(L.linkPrompt, prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <>
      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title={L.bold}
      >
        <strong>B</strong>
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title={L.italic}
      >
        <em>I</em>
      </Btn>
      <Btn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title={L.underline}
      >
        <u>U</u>
      </Btn>
      <Btn
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title={L.code}
      >
        {'</>'}
      </Btn>
      <Btn active={editor.isActive('link')} onClick={setLink} title={L.link}>
        🔗
      </Btn>
    </>
  );
}

/**
 * Advanced formatting: strikethrough, text color, highlight color.
 */
export function AdvancedFormattingButtons({ editor, labels: L }: ToolbarGroupProps) {
  return (
    <>
      <Btn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title={L.strike}
      >
        <s>S</s>
      </Btn>

      <ColorPicker
        title={L.textColor}
        value={(editor.getAttributes('textStyle').color as string | undefined) ?? null}
        glyph={<span style={{ fontWeight: 700 }}>A</span>}
        clearLabel={L.colorDefault}
        onSelect={(c) => {
          if (c === null) editor.chain().focus().unsetColor().run();
          else editor.chain().focus().setColor(c).run();
        }}
      />
      <ColorPicker
        title={L.backgroundColor}
        value={(editor.getAttributes('highlight').color as string | undefined) ?? null}
        glyph={<span style={{ fontWeight: 700 }}>▮</span>}
        clearLabel={L.colorDefault}
        onSelect={(c) => {
          if (c === null) editor.chain().focus().unsetHighlight().run();
          else editor.chain().focus().setHighlight({ color: c }).run();
        }}
      />
    </>
  );
}

/**
 * Text alignment buttons: left, center, right, justify.
 */
export function AlignmentButtons({ editor, labels: L }: ToolbarGroupProps) {
  return (
    <>
      <Btn
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title={L.alignLeft}
      >
        ⬱
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title={L.alignCenter}
      >
        ☱
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title={L.alignRight}
      >
        ⬲
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title={L.alignJustify}
      >
        ☰
      </Btn>
    </>
  );
}

/**
 * Indentation buttons: indent (increase nesting) and outdent (decrease nesting).
 */
export function IndentButtons({ editor, labels: L }: ToolbarGroupProps) {
  return (
    <>
      <Btn
        onClick={() => {
          if (editor.isActive('listItem') || editor.isActive('taskItem')) {
            editor.chain().focus().sinkListItem(
              editor.isActive('taskItem') ? 'taskItem' : 'listItem',
            ).run();
          } else {
            editor.chain().focus().indent().run();
          }
        }}
        title={L.indent}
      >
        ⇥
      </Btn>
      <Btn
        onClick={() => {
          if (editor.isActive('listItem') || editor.isActive('taskItem')) {
            editor.chain().focus().liftListItem(
              editor.isActive('taskItem') ? 'taskItem' : 'listItem',
            ).run();
          } else {
            editor.chain().focus().outdent().run();
          }
        }}
        title={L.outdent}
      >
        ⇤
      </Btn>
    </>
  );
}

/**
 * Heading levels: H1, H2, H3.
 */
export function HeadingButtons({ editor, labels: L }: ToolbarGroupProps) {
  return (
    <>
      <Btn
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title={L.heading1}
      >
        H1
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title={L.heading2}
      >
        H2
      </Btn>
      <Btn
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title={L.heading3}
      >
        H3
      </Btn>
    </>
  );
}

/**
 * List and block buttons: bullet list, ordered list, task list, blockquote, code block, horizontal rule.
 */
export function ListAndBlockButtons({ editor, labels: L }: ToolbarGroupProps) {
  return (
    <>
      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title={L.bulletList}
      >
        • —
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title={L.orderedList}
      >
        1.
      </Btn>
      <Btn
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title={L.taskList}
      >
        ☑
      </Btn>
      <Btn
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title={L.blockquote}
      >
        ❝
      </Btn>
      <Btn
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title={L.codeBlock}
      >
        {'{}'}
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={L.horizontalRule}
      >
        —
      </Btn>
    </>
  );
}

/**
 * Table and media buttons: insert table, iframe, and optional image upload.
 */
export interface TableAndMediaButtonsProps extends ToolbarGroupProps {
  onImage?: () => void;
}

export function TableAndMediaButtons({
  editor,
  labels: L,
  onImage,
}: TableAndMediaButtonsProps) {
  const setIframe = () => {
    const url = window.prompt(L.iframePrompt, '');
    if (!url) return;
    editor.chain().focus().setIframe({ src: url }).run();
  };

  return (
    <>
      <Btn
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title={L.table}
      >
        ⊞
      </Btn>
      <Btn onClick={setIframe} title={L.iframe}>
        🖽
      </Btn>
      {onImage && (
        <Btn onClick={onImage} title={L.uploadImage}>
          🖼
        </Btn>
      )}
    </>
  );
}

/**
 * Import/export and document buttons: Word import/export, comments, find.
 */
export interface DocumentButtonsProps extends ToolbarGroupProps {
  onImportDocx?: () => void;
  onExportDocx?: () => void;
  onAddComment?: () => void;
  onToggleFind?: () => void;
}

export function DocumentButtons({
  editor,
  labels: L,
  onImportDocx,
  onExportDocx,
  onAddComment,
  onToggleFind,
}: DocumentButtonsProps) {
  return (
    <>
      {onImportDocx && (
        <Btn onClick={onImportDocx} title={L.importDocx}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>↥W</span>
        </Btn>
      )}
      {onExportDocx && (
        <Btn onClick={onExportDocx} title={L.exportDocx}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>↧W</span>
        </Btn>
      )}
      {onAddComment && (
        <Btn
          onClick={onAddComment}
          disabled={editor.state.selection.empty}
          title={L.addComment}
        >
          💬
        </Btn>
      )}
      {onToggleFind && (
        <Btn onClick={onToggleFind} title={L.find}>
          🔍
        </Btn>
      )}
    </>
  );
}

/**
 * View mode buttons: HTML, Markdown, Fullscreen toggle.
 */
export interface ViewModeButtonsProps extends ToolbarGroupProps {
  viewMode?: 'wysiwyg' | 'html' | 'markdown';
  isFullscreen?: boolean;
  onInsertHtml?: () => void;
  onInsertMarkdown?: () => void;
  onToggleFullscreen?: () => void;
}

export function ViewModeButtons({
  labels: L,
  viewMode = 'wysiwyg',
  isFullscreen,
  onInsertHtml,
  onInsertMarkdown,
  onToggleFullscreen,
}: ViewModeButtonsProps) {
  return (
    <>
      {onInsertMarkdown && (
        <Btn
          onClick={onInsertMarkdown}
          title={L.insertMarkdown}
          active={viewMode === 'markdown'}
        >
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>md</span>
        </Btn>
      )}
      {onInsertHtml && (
        <Btn
          onClick={onInsertHtml}
          title={L.insertHtml}
          active={viewMode === 'html'}
        >
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{'<>'}</span>
        </Btn>
      )}
      <span className="maya-editor-toolbar__sep" aria-hidden />
      {onToggleFullscreen && (
          <Btn
            onClick={onToggleFullscreen}
            title={isFullscreen ? L.exitFullscreen : L.fullscreen}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </Btn>
      )}
    </>
  );
}
