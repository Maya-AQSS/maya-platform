import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string | number) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}

/**
 * Mark applied to a text range that has an anchored comment.
 *
 * Persistence: the `commentId` attribute references `anchored_comments.id`
 * (server-side). Rebasement on edits is handled by `CommentAnchor.rebase`
 * via ProseMirror's `Transaction.mapping`.
 */
export const CommentMark = Mark.create({
  name: 'comment',
  inclusive: false,
  excludes: '',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-comment-id'),
        renderHTML: (attrs) =>
          attrs.commentId == null
            ? {}
            : { 'data-comment-id': String(attrs.commentId), class: 'maya-anchored-comment' },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId: String(commentId) }),
      unsetComment:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
