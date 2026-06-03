import type { Editor } from '@tiptap/react';
import type { Transaction } from '@tiptap/pm/state';
import type { AnchoredComment } from '../types';

/**
 * Anchored-comment helpers that rebase positions across edits using
 * ProseMirror's `Transaction.mapping`.
 *
 * Stable semantics:
 *   - Insertions BEFORE the anchor → both `from` and `to` shift right.
 *   - Insertions INSIDE the anchor → `to` shifts right; `from` unchanged.
 *   - Deletions overlapping fully  → anchor becomes invalid (`from === to`).
 *   - Deletions partial            → range collapses to the surviving slice.
 */
export interface AnchorRange {
  from: number;
  to: number;
}

export function getAnchorRange(editor: Editor, commentId: string | number): AnchorRange | null {
  let found: AnchorRange | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    node.marks.forEach((mark) => {
      if (mark.type.name === 'comment' && String(mark.attrs.commentId) === String(commentId)) {
        found = { from: pos, to: pos + node.nodeSize };
      }
    });
    return true;
  });
  return found;
}

export function setAnchorRange(
  editor: Editor,
  commentId: string | number,
  range: AnchorRange,
): boolean {
  return editor
    .chain()
    .focus()
    .setTextSelection(range)
    .setComment(commentId)
    .run();
}

/**
 * Rebase a list of anchors against a ProseMirror transaction's mapping.
 * Returns the updated anchors; entries whose range collapsed to zero
 * width are marked `anchorIsValid: false` for server reconciliation.
 */
export function rebaseAnchors(
  anchors: AnchoredComment[],
  tr: Transaction,
): AnchoredComment[] {
  const mapping = tr.mapping;
  return anchors.map((anchor) => {
    const newFrom = mapping.map(anchor.anchorFrom, 1);
    const newTo = mapping.map(anchor.anchorTo, -1);
    const collapsed = newFrom >= newTo;
    return {
      ...anchor,
      anchorFrom: newFrom,
      anchorTo: newTo,
      anchorIsValid: anchor.anchorIsValid && !collapsed,
    };
  });
}
