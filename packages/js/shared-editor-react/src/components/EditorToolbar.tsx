import type { Editor } from '@tiptap/react';
import type { EditorMode } from '../types';

interface EditorToolbarProps {
  editor: Editor | null;
  mode: EditorMode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onInsertHtml?: () => void;
  onInsertMarkdown?: () => void;
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
}

const DEFAULT_LABELS: ToolbarLabels = {
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
};

function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ? 'true' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`maya-editor-toolbar__btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({
  editor,
  mode,
  isFullscreen,
  onToggleFullscreen,
  onInsertHtml,
  onInsertMarkdown,
  labels,
}: EditorToolbarProps) {
  if (!editor) return null;
  const L = labels ?? DEFAULT_LABELS;

  const isLite = mode === 'lite';

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

  const setIframe = () => {
    const url = window.prompt(L.iframePrompt, '');
    if (!url) return;
    editor.chain().focus().setIframe({ src: url }).run();
  };

  return (
    <div className="maya-editor-toolbar" role="toolbar" aria-label="Editor toolbar">
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

      {!isLite && (
        <>
          <span className="maya-editor-toolbar__sep" aria-hidden />
          <Btn
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title={L.strike}
          >
            <s>S</s>
          </Btn>
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
          {onInsertMarkdown && (
            <Btn onClick={onInsertMarkdown} title={L.insertMarkdown}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>md</span>
            </Btn>
          )}
          {onInsertHtml && (
            <Btn onClick={onInsertHtml} title={L.insertHtml}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{'<>'}</span>
            </Btn>
          )}
          {onToggleFullscreen && (
            <>
              <span className="maya-editor-toolbar__sep" aria-hidden />
              <Btn
                onClick={onToggleFullscreen}
                title={isFullscreen ? L.exitFullscreen : L.fullscreen}
              >
                {isFullscreen ? '⤓' : '⛶'}
              </Btn>
            </>
          )}
        </>
      )}
    </div>
  );
}
