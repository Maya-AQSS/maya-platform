export { MayaEditor } from './components/MayaEditor';
export type { MayaEditorProps } from './components/MayaEditor';
export { EditorContentHtml } from './components/EditorContentHtml';
export { EditorContentJson } from './components/EditorContentJson';
export { EditorToolbar, DEFAULT_LABELS } from './components/EditorToolbar';
export type { ToolbarLabels } from './components/EditorToolbar';
export { buildToolbarLabels } from './lib/buildToolbarLabels';
export type { TranslateFn } from './lib/buildToolbarLabels';

export { AlertBlock } from './extensions/AlertBlock';
export type { AlertVariant } from './extensions/AlertBlock';
export { CommentMark } from './extensions/CommentMark';
export { Indent } from './extensions/Indent';
export type { IndentOptions } from './extensions/Indent';
export { ColorPicker } from './components/ColorPicker';

export { useEditorContent } from './hooks/useEditorContent';
export { getAnchorRange, setAnchorRange, rebaseAnchors } from './lib/CommentAnchor';
export type { AnchorRange } from './lib/CommentAnchor';

export { sanitizeEditorHtml, ALLOWED_TAGS, ALLOWED_ATTR } from './lib/dompurifyConfig';
export { markdownToHtml } from './lib/markdownToHtml';
export { htmlToMarkdown } from './lib/htmlToMarkdown';
export { normalizeTableHtml } from './lib/normalizeTableHtml';
export { splitHtmlIntoBlocks } from './lib/splitHtmlIntoBlocks';
export type { BlockChunk, BlockChunkType } from './lib/splitHtmlIntoBlocks';
export { htmlToTiptapDoc } from './lib/htmlToTiptapDoc';
export { renderTiptapJsonToHtml } from './lib/renderTiptapJson';
export { buildMayaEditorExtensions } from './lib/editorExtensions';
export { isEditorReady } from './lib/isEditorReady';
export {
  canonicalTiptapContentJson,
  htmlVisibleTextLength,
  isEmptyTiptapBlockNode,
  isSemanticallyEmptyEditorHtml,
  isSemanticallyEmptyTiptapContent,
  normalizeTiptapContentForCompare,
  normalizeTiptapContentForPersistence,
  normalizeTiptapDocPayload,
  tiptapContentEquals,
} from './lib/tiptapContentSemantics';
export { docxToHtml, docxToHtmlResult } from './lib/docxToHtml';
export type { DocxConversionMessage, DocxConversionResult } from './lib/docxToHtml';
export { SourceInputDialog } from './components/SourceInputDialog';
export { FindReplaceBar } from './components/FindReplaceBar';
export { CommentHoverPopover } from './components/CommentHoverPopover';
export type { CommentHoverData } from './components/CommentHoverPopover';

export type {
  EditorMode,
  TiptapMark,
  TiptapNode,
  TiptapDoc,
  AnchoredComment,
} from './types';
