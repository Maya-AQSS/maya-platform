/**
 * Inline SVG icon set for the editor toolbar.
 *
 * TipTap is headless and ships no UI, so the toolbar (and therefore its icons)
 * is entirely our own. These are Lucide-style 24×24 stroke icons drawn with
 * `currentColor`, so they inherit the button's text colour (light/dark) and add
 * no runtime dependency to the shared package.
 */
import type { ReactNode } from 'react';

export type EditorIconName =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'link'
  | 'textColor'
  | 'highlight'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'indent'
  | 'outdent'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'table'
  | 'image'
  | 'comment'
  | 'find'
  | 'importDocx'
  | 'exportDocx'
  | 'htmlSource'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'columnAddBefore'
  | 'columnAddAfter'
  | 'rowAddBefore'
  | 'rowAddAfter'
  | 'columnDelete'
  | 'rowDelete'
  | 'headerRow'
  | 'tableDelete';

/** Inner SVG geometry per icon (drawn inside a 0 0 24 24 viewBox). */
const PATHS: Record<EditorIconName, ReactNode> = {
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10" />
    </>
  ),
  redo: (
    <>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H14" />
    </>
  ),
  bold: (
    <>
      <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
    </>
  ),
  italic: (
    <>
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </>
  ),
  underline: (
    <>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </>
  ),
  strike: (
    <>
      <path d="M16 5H9.5a3.5 3.5 0 0 0-1 6.8" />
      <path d="M8 19h7a3.5 3.5 0 0 0 1-6.8" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </>
  ),
  code: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  textColor: (
    <>
      <path d="m7 16 4.5-11 4.5 11" />
      <line x1="8.5" y1="12.5" x2="14.5" y2="12.5" />
      <line x1="5" y1="20" x2="19" y2="20" strokeWidth={3} />
    </>
  ),
  highlight: (
    <>
      <path d="m9 11-6 6v3h3l6-6" />
      <path d="m13 7 4 4" />
      <path d="m15 5 4 4-7 7-4-4z" />
    </>
  ),
  alignLeft: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </>
  ),
  alignCenter: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </>
  ),
  alignRight: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </>
  ),
  alignJustify: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  indent: (
    <>
      <polyline points="3 8 7 12 3 16" />
      <line x1="11" y1="6" x2="21" y2="6" />
      <line x1="11" y1="12" x2="21" y2="12" />
      <line x1="11" y1="18" x2="21" y2="18" />
    </>
  ),
  outdent: (
    <>
      <polyline points="7 8 3 12 7 16" />
      <line x1="11" y1="6" x2="21" y2="6" />
      <line x1="11" y1="12" x2="21" y2="12" />
      <line x1="11" y1="18" x2="21" y2="18" />
    </>
  ),
  bulletList: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" />
      <circle cx="3.5" cy="12" r="1" />
      <circle cx="3.5" cy="18" r="1" />
    </>
  ),
  orderedList: (
    <>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 4h1v4" />
      <path d="M3 8h3" />
      <path d="M3 14h2a1 1 0 0 1 0 2H3l3 0" />
    </>
  ),
  taskList: (
    <>
      <rect x="3" y="4" width="6" height="6" rx="1" />
      <path d="m3.5 17 1.5 1.5L8 15.5" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <line x1="13" y1="17" x2="21" y2="17" />
    </>
  ),
  blockquote: (
    <>
      <path d="M6 7H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1c0 2-1 3-3 3" />
      <path d="M15 7h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1c0 2-1 3-3 3" />
      <line x1="20" y1="5" x2="20" y2="19" />
    </>
  ),
  codeBlock: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <polyline points="10 9 7 12 10 15" />
      <polyline points="14 9 17 12 14 15" />
    </>
  ),
  horizontalRule: (
    <>
      <line x1="4" y1="12" x2="20" y2="12" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4-4-9 9" />
    </>
  ),
  comment: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </>
  ),
  find: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </>
  ),
  importDocx: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M5 13V5a2 2 0 0 1 2-2h7l5 5v3" />
      <path d="M5 18h10" />
      <path d="m12 15 3 3-3 3" />
    </>
  ),
  exportDocx: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M19 13V8l-5-5H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
      <path d="M15 18h6" />
      <path d="m18 15 3 3-3 3" />
    </>
  ),
  htmlSource: (
    <>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="13" y1="4" x2="11" y2="20" />
    </>
  ),
  fullscreen: (
    <>
      <rect x="4" y="4" width="16" height="16" />
    </>
  ),

  exitFullscreen: (
    <>
      <rect x="7" y="4" width="13" height="13" />
      <rect x="4" y="7" width="13" height="13" />
    </>
  ),
  // Table editing — a column/row block plus a + (insert) or × (delete).
  columnAddBefore: (
    <>
      <rect x="13" y="4" width="8" height="16" rx="1" />
      <line x1="5" y1="8" x2="5" y2="16" />
      <line x1="1" y1="12" x2="9" y2="12" />
    </>
  ),
  columnAddAfter: (
    <>
      <rect x="3" y="4" width="8" height="16" rx="1" />
      <line x1="19" y1="8" x2="19" y2="16" />
      <line x1="15" y1="12" x2="23" y2="12" />
    </>
  ),
  rowAddBefore: (
    <>
      <rect x="4" y="13" width="16" height="8" rx="1" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="9" y1="6" x2="15" y2="6" />
    </>
  ),
  rowAddAfter: (
    <>
      <rect x="4" y="3" width="16" height="8" rx="1" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </>
  ),
  columnDelete: (
    <>
      <rect x="3" y="4" width="8" height="16" rx="1" />
      <line x1="14" y1="9" x2="20" y2="15" />
      <line x1="20" y1="9" x2="14" y2="15" />
    </>
  ),
  rowDelete: (
    <>
      <rect x="4" y="3" width="16" height="8" rx="1" />
      <line x1="9" y1="14" x2="15" y2="20" />
      <line x1="15" y1="14" x2="9" y2="20" />
    </>
  ),
  headerRow: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth={3} />
      <line x1="9" y1="9" x2="9" y2="20" />
      <line x1="15" y1="9" x2="15" y2="20" />
    </>
  ),
  tableDelete: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
};

export interface EditorIconProps {
  name: EditorIconName;
  size?: number;
}

/** Renders a toolbar icon by name. Inherits colour via `currentColor`. */
export function EditorIcon({ name, size = 16 }: EditorIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
