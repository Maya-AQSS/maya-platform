# @ceedcv-maya/shared-editor-react

Unified TipTap editor for the Maya ecosystem.

## Components

- **`<MayaEditor mode="lite" | "full" />`** — single editor with two visual modes. `lite` for short comments and alerts; `full` for templates and documents (BlockNote parity).
- **`<EditorContentHtml html />`** — read-only renderer with DOMPurify sanitisation (aligned with the server-side `TiptapHtmlRenderer`).
- **`<EditorToolbar />`** — toolbar builder, used internally by `MayaEditor` and exposed for custom integrations.

## Extensions

- `IframeBlock` — sandboxed iframe block with optional domain allowlist.
- `AlertBlock` — variants info / warning / success / danger.
- `CommentMark` — anchored-comment mark (paired with `AnchoredCommentController` server-side).

## Conversion

- `convertBlockNoteToTiptap(blocks)` — legacy → ProseMirror conversion. Mirror of the PHP `Maya\Editor\Renderers\BlockNoteToTiptap`.

## Document import & block splitting

Helpers behind the "Import from Word → blocks" flow (`DocxBlockSplitter` in maya_dms):

- `docxToHtml(file)` / `docxToHtmlResult(file)` — convert a `.docx` `File` to sanitised, editor-ready HTML via mammoth (loaded dynamically, ~430KB). `docxToHtmlResult` also returns mammoth's `messages` (warnings for unrecognised styles / track changes that may not import cleanly).
- `splitHtmlIntoBlocks(html)` — split an HTML fragment into top-level `BlockChunk[]` (heading / paragraph / list / table / figure / blockquote / codeBlock / horizontalRule / other), preserving each element's `outerHTML` for a lossless round-trip. **List items are exploded one chunk per `<li>`** (re-wrapped in their `<ul>`/`<ol>`) so callers can assign each bullet to a different block. Empty whitespace/`<br>`-only paragraphs are flagged `isEmpty`.
- `htmlToTiptapDoc(html, extensions?)` — convert HTML to a TipTap JSON doc using a headless editor with the canonical Maya extensions, so the round-trip matches what the live editor persists. Empty input yields a doc with one empty paragraph (TipTap's normalised empty state).
- `buildMayaEditorExtensions(mode)` — the canonical TipTap extension list, shared by `MayaEditor` and `htmlToTiptapDoc` (single source of truth for the schema).

```ts
const html = await docxToHtml(file);
const chunks = splitHtmlIntoBlocks(html).filter((c) => !c.isEmpty);
// …user groups chunks into blocks…
const doc = htmlToTiptapDoc(groupHtml); // → persist doc.content
```

Known mammoth limitations: track changes and comments are dropped; non-standard Word styles may not map. `docxToHtmlResult().messages` surfaces these.

## Anchored comments

- `getAnchorRange(editor, commentId)` / `setAnchorRange(editor, id, range)`
- `rebaseAnchors(anchors, tr)` — applies a ProseMirror `Transaction.mapping` to a list of anchors and flags collapsed ones as invalid.

## Sanitisation

- `sanitizeEditorHtml(rawHtml)` — DOMPurify config covering the full set of tags emitted by `TiptapHtmlRenderer` (paragraph, headings, lists, tables, blockquote, code, images, iframes with `sandbox`, alerts).

## Usage

```tsx
import { MayaEditor } from '@ceedcv-maya/shared-editor-react';

<MayaEditor
  mode="full"
  initialContent={template.html}
  editable={canEdit}
  onChange={(html) => save(html)}
  isDark={theme === 'dark'}
/>
```

Lite mode for short comments:

```tsx
<MayaEditor mode="lite" initialContent={comment.body} onChange={setBody} />
```
