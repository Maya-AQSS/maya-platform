/**
 * Semantic fingerprint of rendered editor HTML, used by the renderer parity
 * oracle. MUST stay logically identical to the PHP version in
 * `shared-editor-laravel/tests/Support/Fingerprint.php`.
 *
 * Captures content + structure (what must agree between the CSR static renderer
 * and the server-side `TiptapHtmlRenderer`), deliberately ignoring cosmetic
 * markup (wrappers, data-* attributes, inline-style formatting).
 */
export interface HtmlFingerprint {
  text: string;
  headings: number[];
  links: string[];
  images: string[];
  strong: number;
  em: number;
  u: number;
  s: number;
  code: number;
  ul: number;
  ol: number;
  li: number;
  pre: number;
  blockquote: number;
  hr: number;
  table: number;
  tr: number;
  th: number;
  td: number;
  aside: number;
  checkbox: number;
}

export function fingerprintHtml(html: string): HtmlFingerprint {
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  if (!root) {
    throw new Error('fingerprintHtml: could not parse HTML');
  }

  const count = (sel: string): number => root.querySelectorAll(sel).length;
  const attrs = (sel: string, attr: string): string[] =>
    Array.from(root.querySelectorAll(sel))
      .map((el) => el.getAttribute(attr) ?? '')
      .sort();

  return {
    // Whitespace removed entirely: inter-element spacing (e.g. the space PHP
    // emits after a task checkbox, or block concatenation) is cosmetic and must
    // not break parity — only the sequence of visible characters matters.
    text: (root.textContent ?? '').replace(/\s+/g, ''),
    headings: Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) =>
      Number(h.tagName.charAt(1)),
    ),
    links: attrs('a[href]', 'href'),
    images: attrs('img[src]', 'src'),
    strong: count('strong'),
    em: count('em'),
    u: count('u'),
    s: count('s'),
    code: count('code'),
    ul: count('ul'),
    ol: count('ol'),
    li: count('li'),
    pre: count('pre'),
    blockquote: count('blockquote'),
    hr: count('hr'),
    table: count('table'),
    tr: count('tr'),
    th: count('th'),
    td: count('td'),
    aside: count('aside'),
    checkbox: count('input[type="checkbox"]'),
  };
}
