import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export interface IndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
}

/**
 * Adds an `indent` attribute (integer level) to paragraph/heading nodes
 * and exposes `indent()` / `outdent()` commands.
 *
 * Lists and task lists already have native indent via Tab/Shift-Tab from
 * StarterKit's `listKeymap`; this extension covers the rest of the
 * schema so the toolbar Indent button works on any block.
 *
 * Rendered as inline `style="margin-left: <level * step>em"` so the
 * output round-trips through the SSR renderer and copy-pastes elsewhere
 * without losing the visual.
 */
export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const attr = element.getAttribute('data-indent');
              if (attr) return parseInt(attr, 10) || 0;
              const ml = (element as HTMLElement).style?.marginLeft;
              if (ml && ml.endsWith('em')) {
                return Math.max(0, Math.round(parseFloat(ml) / 2));
              }
              return 0;
            },
            renderHTML: (attrs) => {
              const level = Number(attrs.indent) || 0;
              if (level <= 0) return {};
              return {
                'data-indent': String(level),
                style: `margin-left: ${level * 2}em`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          let changed = false;
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            const current = (node.attrs?.indent as number) ?? 0;
            const next = Math.min(this.options.maxLevel, current + 1);
            if (next === current) return;
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          });
          return changed;
        },
      outdent:
        () =>
        ({ state, tr, dispatch }) => {
          const { selection } = state;
          let changed = false;
          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            const current = (node.attrs?.indent as number) ?? 0;
            const next = Math.max(this.options.minLevel, current - 1);
            if (next === current) return;
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          });
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // Don't steal Tab from lists/tasks/tables — those have their own handlers.
        const { state } = this.editor;
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const name = $from.node(depth).type.name;
          if (['listItem', 'taskItem', 'tableCell', 'tableHeader'].includes(name)) {
            return false;
          }
        }
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const name = $from.node(depth).type.name;
          if (['listItem', 'taskItem', 'tableCell', 'tableHeader'].includes(name)) {
            return false;
          }
        }
        return this.editor.commands.outdent();
      },
    };
  },
});
