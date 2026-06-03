/**
 * Lightweight Markdown → HTML converter for the editor's "Insert Markdown"
 * action. Supports the subset that maps cleanly to the ProseMirror schema
 * we ship (StarterKit + extension-link + extension-table-ish lists +
 * task lists). Anything else is preserved as plain text.
 *
 * Not a full CommonMark implementation — for a richer parse, callers can
 * swap this for `marked`/`markdown-it` and feed the result to
 * `editor.commands.insertContent`.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BLOCK_HTML_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'div', 'dl', 'dd', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'header', 'hr', 'iframe', 'main', 'nav', 'noscript',
  'ol', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'tr', 'ul', 'video', 'img', 'caption', 'colgroup', 'col',
  'label', 'input',
]);

const VOID_HTML_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
]);

function isBlockHtmlTag(name: string): boolean {
  return BLOCK_HTML_TAGS.has(name.toLowerCase());
}

function applyInline(text: string): string {
  let out = escapeHtml(text);
  // Inline code first so its content isn't re-formatted.
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  // Bold + italic.
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');
  // Strikethrough.
  out = out.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  // Links — only http/https/mailto/tel; reject `javascript:` etc.
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safe = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : '#';
    return `<a href="${safe}">${label}</a>`;
  });
  // Auto-link bare URLs (idempotent — won't double-link inside <a>).
  out = out.replace(/(?<!href=")(?<!>)\b(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g, (m) => `<a href="${m}">${m}</a>`);
  return out;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block (``` … ```).
    const fenceMatch = line.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      i++;
      const code: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // ATX heading.
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${applyInline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule.
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // GitHub-Flavoured pipe table.
    //   | h1 | h2 |
    //   | -- | -- |
    //   | c1 | c2 |
    if (
      /^\s*\|.*\|\s*$/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      const split = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
      const headers = split(line);
      i += 2; // header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(split(lines[i]));
        i++;
      }
      let table = '<table><tbody><tr>';
      for (const h of headers) table += `<th>${applyInline(h)}</th>`;
      table += '</tr>';
      for (const r of rows) {
        table += '<tr>';
        for (const c of r) table += `<td>${applyInline(c)}</td>`;
        table += '</tr>';
      }
      table += '</tbody></table>';
      out.push(table);
      continue;
    }

    // Raw HTML block — line that opens with a known block-level tag is
    // passed through verbatim up to its closing tag (or until a blank line).
    // Lets `htmlToMarkdown` round-trip elements that have no markdown
    // analogue (iframe, aside.alert, figure/figcaption, span with style).
    const rawTag = line.match(/^<\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/);
    if (rawTag && isBlockHtmlTag(rawTag[1])) {
      const tag = rawTag[1].toLowerCase();
      const isSelfClosing = /\/\s*>\s*$/.test(line) || VOID_HTML_TAGS.has(tag);
      const buf: string[] = [line];
      i++;
      if (!isSelfClosing) {
        const closeRe = new RegExp(`</\\s*${tag}\\s*>`, 'i');
        while (i < lines.length && !closeRe.test(lines[i - 1])) {
          if (lines[i].trim() === '') break;
          buf.push(lines[i]);
          if (closeRe.test(lines[i])) {
            i++;
            break;
          }
          i++;
        }
      }
      out.push(buf.join('\n'));
      continue;
    }

    // Blockquote — group consecutive `> ` lines.
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote><p>${applyInline(buf.join(' '))}</p></blockquote>`);
      continue;
    }

    // Task list — `- [ ]` / `- [x]`.
    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      out.push('<ul data-type="taskList">');
      while (i < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
        if (!m) break;
        const checked = m[1].toLowerCase() === 'x';
        out.push(
          `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox" ${checked ? 'checked' : ''}><span></span></label><div><p>${applyInline(m[2])}</p></div></li>`,
        );
        i++;
      }
      out.push('</ul>');
      continue;
    }

    // Unordered list.
    if (/^\s*[-*+]\s+/.test(line)) {
      out.push('<ul>');
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (!m) break;
        out.push(`<li><p>${applyInline(m[1])}</p></li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      out.push('<ol>');
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*\d+\.\s+(.*)$/);
        if (!m) break;
        out.push(`<li><p>${applyInline(m[1])}</p></li>`);
        i++;
      }
      out.push('</ol>');
      continue;
    }

    // Blank line.
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — coalesce consecutive non-blank lines (single `\n` becomes a space).
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6}\s|>|```|\s*[-*+]\s|\s*\d+\.\s|\s*(-{3,}|\*{3,}|_{3,})\s*$|\s*\|)/.test(lines[i]) &&
      !/^<\s*[a-zA-Z]/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${applyInline(para.join(' '))}</p>`);
  }

  return out.join('');
}
