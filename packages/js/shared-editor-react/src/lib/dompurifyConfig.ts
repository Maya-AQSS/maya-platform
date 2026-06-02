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
  // Data attributes: trusted because they originate from TiptapHtmlRenderer, not user input
  'data-node-type',
  'data-comment-id',
  'data-block-type',
  'data-original-type',
  'data-indent',
  // iframe sandbox attribute: server-side renderer sets default sandbox if none present
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
 * Restricts URL schemes — blocks dangerous protocols like `javascript:`, `data:`, `vbscript:`.
 * This pattern is exported for reference and should match the server-side TiptapHtmlRenderer
 * URL scheme validation for consistent security across client and server.
 *
 * Allowed schemes:
 * - http:// and https:// (secure web links)
 * - mailto: (email links)
 * - tel: (phone links)
 * - # (fragment identifiers / anchors)
 * - /, ./, ../ (relative paths)
 */
export const ALLOWED_URI_REGEXP = /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;

let hooksInstalled = false;

/**
 * Install DOMPurify hooks for sanitization enhancements:
 * - Ensure INPUT elements without a type attribute default to 'checkbox'
 */
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
