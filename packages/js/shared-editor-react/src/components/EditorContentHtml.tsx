import { useMemo } from 'react';
import { sanitizeEditorHtml } from '../lib/dompurifyConfig';

interface EditorContentHtmlProps {
  /** Pre-rendered HTML (typically from server-side TiptapHtmlRenderer). */
  html: string;
  className?: string;
}

/**
 * Renders pre-sanitised editor HTML. Use this for read-only views (PDF
 * previews, validator views, search hit cards) — for editing, use
 * `<MayaEditor />`.
 *
 * Sanitises with the package DOMPurify config (aligned with the SSR
 * renderer) — defence in depth, not a substitute for server-side
 * sanitisation.
 */
export function EditorContentHtml({ html, className }: EditorContentHtmlProps) {
  const safeHtml = useMemo(() => sanitizeEditorHtml(html), [html]);
  if (!safeHtml) return null;

  return (
    <div
      className={className ?? 'maya-editor-content'}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
