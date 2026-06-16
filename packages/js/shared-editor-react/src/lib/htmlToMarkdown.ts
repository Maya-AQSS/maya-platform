/**
 * Lightweight HTML → Markdown converter for the editor's "Markdown view".
 * Symmetric with `markdownToHtml`: supports the subset that round-trips
 * through StarterKit + link/table/task-list extensions.
 *
 * Falls back to the raw text content for unknown elements so nothing is
 * silently dropped from the source view.
 */

function unwrapText(node: Node): string {
  return node.textContent ?? '';
}

function inlineToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(inlineToMarkdown).join('');

  switch (el.tagName) {
    case 'BR': return '\n';
    case 'STRONG':
    case 'B': return `**${inner}**`;
    case 'EM':
    case 'I': return `*${inner}*`;
    case 'U': return inner; // Markdown has no underline; preserve the text.
    case 'S':
    case 'DEL':
    case 'STRIKE': return `~~${inner}~~`;
    case 'CODE': return `\`${inner}\``;
    case 'A': {
      const href = el.getAttribute('href') ?? '';
      return href ? `[${inner}](${href})` : inner;
    }
    case 'SPAN': return inner;
    default: return inner;
  }
}

function blockToMarkdown(el: Element, listDepth = 0): string {
  const indent = '  '.repeat(listDepth);

  switch (el.tagName) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6': {
      const level = Number(el.tagName.substring(1));
      return `${'#'.repeat(level)} ${inlineToMarkdown(el).trim()}\n\n`;
    }
    case 'P':
      return `${inlineToMarkdown(el).trim()}\n\n`;
    case 'BLOCKQUOTE': {
      const inner = Array.from(el.children)
        .map((c) => blockToMarkdown(c, listDepth).trim())
        .filter(Boolean)
        .join('\n');
      const text = inner || inlineToMarkdown(el).trim();
      return text
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n') + '\n\n';
    }
    case 'PRE': {
      const code = el.querySelector('code');
      const text = code ? unwrapText(code) : unwrapText(el);
      return `\`\`\`\n${text}\n\`\`\`\n\n`;
    }
    case 'HR':
      return '---\n\n';
    case 'UL': {
      const isTaskList = el.getAttribute('data-type') === 'taskList';
      const out = Array.from(el.children).map((li) => {
        if (isTaskList) {
          const checked = (li as HTMLElement).getAttribute('data-checked') === 'true';
          const text = Array.from(li.querySelectorAll('p'))
            .map(inlineToMarkdown)
            .join(' ')
            .trim();
          return `${indent}- [${checked ? 'x' : ' '}] ${text}`;
        }
        return listItemToMarkdown(li, '-', listDepth);
      }).join('\n');
      return out + '\n\n';
    }
    case 'OL': {
      let i = 1;
      const out = Array.from(el.children).map((li) => {
        const marker = `${i++}.`;
        return listItemToMarkdown(li, marker, listDepth);
      }).join('\n');
      return out + '\n\n';
    }
    case 'TABLE': {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return '';
      const tableRows = rows.map((tr) => {
        const cells = Array.from(tr.children).map((c) => inlineToMarkdown(c).trim().replace(/\n/g, ' '));
        return `| ${cells.join(' | ')} |`;
      });
      // Insert a separator row after the first.
      if (tableRows.length > 1) {
        const sep = `| ${Array.from(rows[0].children).map(() => '---').join(' | ')} |`;
        tableRows.splice(1, 0, sep);
      }
      return tableRows.join('\n') + '\n\n';
    }
    case 'IMG': {
      const src = el.getAttribute('src') ?? '';
      const alt = el.getAttribute('alt') ?? '';
      return `![${alt}](${src})\n\n`;
    }
    case 'ASIDE':
      return Array.from(el.children).map((c) => blockToMarkdown(c, listDepth)).join('');
    case 'FIGURE': {
      const img = el.querySelector('img');
      const caption = el.querySelector('figcaption');
      if (img) {
        const src = img.getAttribute('src') ?? '';
        const alt = img.getAttribute('alt') ?? caption?.textContent ?? '';
        return `![${alt}](${src})\n\n`;
      }
      return inlineToMarkdown(el) + '\n\n';
    }
    default:
      return inlineToMarkdown(el) + '\n';
  }
}

function listItemToMarkdown(li: Element, marker: string, depth: number): string {
  const indent = '  '.repeat(depth);
  const blocks = Array.from(li.children);
  if (blocks.length === 0) return `${indent}${marker} ${inlineToMarkdown(li).trim()}`;

  const lines: string[] = [];
  for (const child of blocks) {
    if (child.tagName === 'UL' || child.tagName === 'OL') {
      const nested = blockToMarkdown(child, depth + 1).trimEnd();
      if (nested) lines.push(nested);
    } else {
      const text = inlineToMarkdown(child).trim();
      if (text) {
        lines.push(lines.length === 0 ? `${indent}${marker} ${text}` : `${indent}  ${text}`);
      }
    }
  }
  if (lines.length === 0) lines.push(`${indent}${marker}`);
  return lines.join('\n');
}

export function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  const out = Array.from(root.children).map((el) => blockToMarkdown(el)).join('').trim();
  return out + '\n';
}
