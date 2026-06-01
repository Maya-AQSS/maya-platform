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
