import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CommentHoverData {
  /** Display name of the comment author. */
  author?: string;
  /** ISO/locale string shown under the author; consumer formats it. */
  createdAt?: string;
  /** Body of the comment (plain text, line breaks are honoured). */
  body: string;
}

interface CommentHoverPopoverProps {
  comment: CommentHoverData | null;
  /** Viewport-relative coordinates of the highlighted span. */
  anchorRect: DOMRect | null;
  isDark?: boolean;
  /** Optional close button label (used only for the aria-label). */
  closeLabel?: string;
}

/**
 * Tooltip-style popover anchored above an editor span carrying a
 * `data-comment-id`. Renders via a portal so it escapes the editor's
 * `overflow: hidden` clip box and isn't clipped by the wizard layout.
 *
 * Positioning: prefers the top edge of the highlighted span; flips below
 * when there's no room above (within 16px viewport padding).
 */
export function CommentHoverPopover({
  comment,
  anchorRect,
  isDark = false,
  closeLabel = 'Close',
}: CommentHoverPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!ref.current || !comment) return;
    const r = ref.current.getBoundingClientRect();
    setSize({ width: r.width, height: r.height });
  }, [comment?.body, comment?.author]);

  if (!comment || !anchorRect || typeof document === 'undefined') return null;

  const padding = 8;
  const margin = 16;
  const popoverW = size?.width ?? 280;
  const popoverH = size?.height ?? 80;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Place above if there's room, otherwise below.
  const placeAbove = anchorRect.top - popoverH - padding > margin;
  const top = placeAbove
    ? Math.max(margin, anchorRect.top - popoverH - padding)
    : Math.min(vh - popoverH - margin, anchorRect.bottom + padding);

  // Centre horizontally over the span; clamp to viewport.
  const centerX = anchorRect.left + anchorRect.width / 2;
  const left = Math.max(margin, Math.min(vw - popoverW - margin, centerX - popoverW / 2));

  return createPortal(
    <div
      ref={ref}
      className={`maya-comment-popover${isDark ? ' is-dark' : ''}`}
      role="tooltip"
      aria-label={closeLabel}
      style={{ top, left, maxWidth: 320 }}
    >
      <div className="maya-comment-popover__header">
        <span className="maya-comment-popover__author">{comment.author ?? 'Comentario'}</span>
        {comment.createdAt && (
          <span className="maya-comment-popover__date">{comment.createdAt}</span>
        )}
      </div>
      <div className="maya-comment-popover__body">{comment.body}</div>
    </div>,
    document.body,
  );
}
