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
