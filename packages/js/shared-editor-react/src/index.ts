export { MayaEditor } from './components/MayaEditor';
export type { MayaEditorProps } from './components/MayaEditor';
export { EditorContentHtml } from './components/EditorContentHtml';
export { EditorToolbar } from './components/EditorToolbar';
export type { ToolbarLabels } from './components/EditorToolbar';

export { IframeBlock } from './extensions/IframeBlock';
export { AlertBlock } from './extensions/AlertBlock';
export type { AlertVariant } from './extensions/AlertBlock';
export { CommentMark } from './extensions/CommentMark';

export { convertBlockNoteToTiptap } from './serializers/BlockNoteToTiptap';
export { useEditorContent } from './hooks/useEditorContent';
export { getAnchorRange, setAnchorRange, rebaseAnchors } from './lib/CommentAnchor';
export type { AnchorRange } from './lib/CommentAnchor';

export { sanitizeEditorHtml, ALLOWED_TAGS, ALLOWED_ATTR } from './lib/dompurifyConfig';
export { markdownToHtml } from './lib/markdownToHtml';
export { htmlToMarkdown } from './lib/htmlToMarkdown';
export { SourceInputDialog } from './components/SourceInputDialog';

export type {
  EditorMode,
  TiptapMark,
  TiptapNode,
  TiptapDoc,
  AnchoredComment,
  BlockNoteBlock,
  BlockNoteInline,
  BlockNoteStyles,
} from './types';

export { default as esTranslations } from './i18n/es.json';
export { default as enTranslations } from './i18n/en.json';
