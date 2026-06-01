import { Node, mergeAttributes } from '@tiptap/core';

export type AlertVariant = 'info' | 'warning' | 'success' | 'danger';

const VARIANTS: AlertVariant[] = ['info', 'warning', 'success', 'danger'];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    alert: {
      setAlert: (variant: AlertVariant) => ReturnType;
      toggleAlert: (variant: AlertVariant) => ReturnType;
    };
  }
}

export const AlertBlock = Node.create({
  name: 'alert',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-variant') ?? 'info';
          return VARIANTS.includes(v as AlertVariant) ? v : 'info';
        },
        renderHTML: (attrs) => ({
          'data-variant': attrs.variant,
          class: `alert alert-${attrs.variant}`,
          role: 'note',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-variant]' }, { tag: 'aside.alert' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setAlert:
        (variant) =>
        ({ commands }) =>
          commands.setNode(this.name, { variant }),
      toggleAlert:
        (variant) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
    };
  },
});
