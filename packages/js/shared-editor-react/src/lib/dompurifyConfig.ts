import DOMPurify from 'dompurify';

/**
 * DOMPurify config aligned with the server-side TiptapHtmlRenderer output
 * so the SSR-rendered HTML survives client-side sanitization without
 * silent tag stripping.
 *
 * Ampliated by council audit (Fase 0) — the previous BlockNote config
 * only allowed `[label, input, ul]` which silently stripped `<p>, <h1-6>,
 * <strong>, <table>, <img>, <a>, <blockquote>` etc. emitted by the PHP
 * renderer.
 */
export const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'em',
  'u',
  's',
  'code',
  'pre',
  'blockquote',
  'span',
  'div',
  'a',
  'ul',
  'ol',
  'li',
  'label',
  'input',
  'figure',
  'figcaption',
  'img',
  'iframe',
  'aside',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'colgroup',
  'col',
  'tr',
  'th',
  'td',
];

export const ALLOWED_ATTR = [
  'class',
  'style',
  'href',
  'src',
  'alt',
  'title',
  'type',
  'checked',
  'disabled',
  'colspan',
  'rowspan',
  'role',
  'data-node-type',
  'data-comment-id',
  'data-block-type',
  'data-original-type',
  'data-indent',
  'sandbox',
  'loading',
  'scope',
  'headers',
  'summary',
  'abbr',
  'span',
  'id',
];

/**
 * Restricts URL schemes — blocks `javascript:`, `data:`, `vbscript:`.
 */
export const ALLOWED_URI_REGEXP = /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;

let hooksInstalled = false;

function installDomPurifyHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if ((node as Element).tagName === 'INPUT' && !(node as Element).getAttribute('type')) {
      (node as Element).setAttribute('type', 'checkbox');
    }
  });
}

export function sanitizeEditorHtml(rawHtml: string): string {
  installDomPurifyHooks();
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}
