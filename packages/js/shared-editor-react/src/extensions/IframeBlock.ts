import { Node, mergeAttributes } from '@tiptap/core';

export interface IframeOptions {
  HTMLAttributes: Record<string, unknown>;
  allowedDomains: string[] | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string; title?: string }) => ReturnType;
    };
  }
}

/**
 * Custom iframe block — replaces the legacy `createIframeBlock.ts`
 * BlockNote-specific component.
 */
export const IframeBlock = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        sandbox: 'allow-scripts allow-same-origin',
        loading: 'lazy',
      },
      allowedDomains: null,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      width: { default: '100%' },
      height: { default: '400' },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setIframe:
        (options) =>
        ({ commands }) => {
          if (!options.src) return false;
          if (this.options.allowedDomains) {
            try {
              const url = new URL(options.src);
              const allowed = this.options.allowedDomains.some((d) => url.host.endsWith(d));
              if (!allowed) return false;
            } catch {
              return false;
            }
          }
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
