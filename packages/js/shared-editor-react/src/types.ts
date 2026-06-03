export type EditorMode = 'lite' | 'full';

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface AnchoredComment {
  id: number | string;
  commentId: number | string;
  resourceType: string;
  resourceId: number | string;
  anchorFrom: number;
  anchorTo: number;
  anchorTextSnapshot: string;
  anchorIsValid: boolean;
  anchorLastSyncedAt: string | null;
}

export interface BlockNoteStyles {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

export interface BlockNoteInline {
  type: string;
  text?: string;
  styles?: BlockNoteStyles;
  href?: string;
  content?: BlockNoteInline[];
}

export interface BlockNoteBlock {
  type: string;
  props?: Record<string, unknown>;
  content?: BlockNoteInline[] | { rows?: Array<{ cells: unknown[] }> };
  children?: BlockNoteBlock[];
}
