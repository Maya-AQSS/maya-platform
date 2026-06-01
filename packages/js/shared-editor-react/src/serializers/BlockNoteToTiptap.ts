/**
 * JS mirror of Maya\Editor\Renderers\BlockNoteToTiptap (PHP).
 *
 * Same input/output as the PHP version — used for round-trip oracle tests
 * (BlockNote → Tiptap → HTML via both renderers must produce identical
 * output) and at-runtime when the frontend reads legacy `content` columns
 * during the migration window.
 */
import type {
  BlockNoteBlock,
  BlockNoteInline,
  BlockNoteStyles,
  TiptapDoc,
  TiptapMark,
  TiptapNode,
} from '../types';

type ListBlockType = 'bulletListItem' | 'numberedListItem' | 'checkListItem';

const LIST_TO_LIST_NODE: Record<ListBlockType, 'bulletList' | 'orderedList' | 'taskList'> = {
  bulletListItem: 'bulletList',
  numberedListItem: 'orderedList',
  checkListItem: 'taskList',
};

export function convertBlockNoteToTiptap(blocks: BlockNoteBlock[]): TiptapDoc {
  const content: TiptapNode[] = [];
  let i = 0;
  const n = blocks.length;
  while (i < n) {
    const block = blocks[i];
    if (!block || typeof block !== 'object') {
      i++;
      continue;
    }
    const type = String(block.type ?? 'paragraph');

    if (type === 'bulletListItem' || type === 'numberedListItem' || type === 'checkListItem') {
      const listType = LIST_TO_LIST_NODE[type as ListBlockType];
      const items: TiptapNode[] = [];
      while (
        i < n &&
        blocks[i] &&
        (blocks[i].type === type)
      ) {
        items.push(convertListItem(blocks[i], type as ListBlockType));
        i++;
      }
      content.push({ type: listType, content: items });
      continue;
    }

    content.push(convertBlock(block));
    i++;
  }

  return { type: 'doc', content };
}

function convertBlock(block: BlockNoteBlock): TiptapNode {
  const type = String(block.type ?? 'paragraph');
  const props = (block.props ?? {}) as Record<string, unknown>;
  const inline = convertInline((block.content as BlockNoteInline[] | undefined) ?? []);
  const attrs = propsToAttrs(props);

  switch (type) {
    case 'heading': {
      const lvl = Math.max(1, Math.min(6, Number(props.level ?? 2) || 2));
      return { type: 'heading', attrs: { ...attrs, level: lvl }, content: inline };
    }
    case 'paragraph':
      return { type: 'paragraph', attrs, content: inline };
    case 'quote':
      return {
        type: 'blockquote',
        attrs,
        content: [{ type: 'paragraph', content: inline }],
      };
    case 'codeBlock':
      return { type: 'codeBlock', attrs, content: inline };
    case 'image':
      return {
        type: 'image',
        attrs: {
          src: String(props.url ?? ''),
          alt: String(props.caption ?? ''),
          caption: String(props.caption ?? ''),
        },
      };
    case 'table':
      return convertTable((block.content as { rows?: unknown[] } | undefined) ?? {});
    default:
      return {
        type: 'paragraph',
        attrs: { ...attrs, 'data-original-type': type },
        content: inline,
      };
  }
}

function convertListItem(block: BlockNoteBlock, blockType: ListBlockType): TiptapNode {
  const props = (block.props ?? {}) as Record<string, unknown>;
  const inline = convertInline((block.content as BlockNoteInline[] | undefined) ?? []);
  const attrs = propsToAttrs(props);

  const itemContent: TiptapNode[] = [{ type: 'paragraph', content: inline }];

  const children = block.children ?? [];
  if (children.length > 0) {
    const childDoc = convertBlockNoteToTiptap(children);
    for (const childNode of childDoc.content) {
      itemContent.push(childNode);
    }
  }

  if (blockType === 'checkListItem') {
    return {
      type: 'taskItem',
      attrs: { ...attrs, checked: !!props.checked },
      content: itemContent,
    };
  }

  return { type: 'listItem', attrs, content: itemContent };
}

function convertTable(content: { rows?: unknown[] }): TiptapNode {
  const rows = Array.isArray(content.rows) ? content.rows : [];
  const proseRows: TiptapNode[] = [];
  let isFirstRow = true;
  for (const row of rows) {
    if (!row || typeof row !== 'object' || !Array.isArray((row as { cells?: unknown[] }).cells)) {
      continue;
    }
    const cells: TiptapNode[] = [];
    for (const cell of (row as { cells: unknown[] }).cells) {
      let cellContent: TiptapNode[] = [];
      const cellAttrs: Record<string, unknown> = {};
      if (cell && typeof cell === 'object') {
        const cellObj = cell as { content?: unknown; props?: { colspan?: unknown; rowspan?: unknown } };
        if (Array.isArray(cellObj.content)) {
          cellContent = convertInline(cellObj.content as BlockNoteInline[]);
          if (cellObj.props) {
            if (cellObj.props.colspan != null) {
              cellAttrs.colspan = Number(cellObj.props.colspan) || 1;
            }
            if (cellObj.props.rowspan != null) {
              cellAttrs.rowspan = Number(cellObj.props.rowspan) || 1;
            }
          }
        } else if (Array.isArray(cell)) {
          cellContent = convertInline(cell as BlockNoteInline[]);
        }
      }
      cells.push({
        type: isFirstRow ? 'tableHeader' : 'tableCell',
        attrs: cellAttrs,
        content: [{ type: 'paragraph', content: cellContent }],
      });
    }
    proseRows.push({ type: 'tableRow', content: cells });
    isFirstRow = false;
  }

  return { type: 'table', content: proseRows };
}

function convertInline(content: BlockNoteInline[]): TiptapNode[] {
  const out: TiptapNode[] = [];
  for (const span of content) {
    if (!span || typeof span !== 'object') continue;
    const type = String(span.type ?? 'text');
    if (type === 'text') {
      const text = String(span.text ?? '');
      if (text === '') continue;
      const marks = stylesToMarks(span.styles ?? {});
      const node: TiptapNode = { type: 'text', text };
      if (marks.length > 0) node.marks = marks;
      out.push(node);
    } else if (type === 'link') {
      const href = String(span.href ?? '');
      const linkMark: TiptapMark = { type: 'link', attrs: { href } };
      for (const inner of span.content ?? []) {
        if (!inner || inner.type !== 'text') continue;
        const text = String(inner.text ?? '');
        if (text === '') continue;
        const marks = [...stylesToMarks(inner.styles ?? {}), linkMark];
        out.push({ type: 'text', text, marks });
      }
    }
  }
  return out;
}

function stylesToMarks(styles: BlockNoteStyles): TiptapMark[] {
  const marks: TiptapMark[] = [];
  if (styles.bold) marks.push({ type: 'bold' });
  if (styles.italic) marks.push({ type: 'italic' });
  if (styles.underline) marks.push({ type: 'underline' });
  if (styles.strike) marks.push({ type: 'strike' });
  if (styles.code) marks.push({ type: 'code' });
  if (styles.textColor && styles.textColor !== 'default') {
    marks.push({ type: 'textStyle', attrs: { color: styles.textColor } });
  }
  if (styles.backgroundColor && styles.backgroundColor !== 'default') {
    marks.push({ type: 'highlight', attrs: { color: styles.backgroundColor } });
  }
  return marks;
}

function propsToAttrs(props: Record<string, unknown>): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  if (props.textColor && props.textColor !== 'default') {
    attrs.textColor = String(props.textColor);
  }
  if (props.backgroundColor && props.backgroundColor !== 'default') {
    attrs.backgroundColor = String(props.backgroundColor);
  }
  if (props.textAlignment) {
    attrs.textAlign = String(props.textAlignment);
  }
  return attrs;
}
