import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

interface FindReplaceBarProps {
  editor: Editor;
  open: boolean;
  onClose: () => void;
  labels: {
    findPlaceholder: string;
    replacePlaceholder: string;
    findNext: string;
    findPrev: string;
    replace: string;
    replaceAll: string;
    close: string;
    caseSensitive: string;
    count: (current: number, total: number) => string;
    none: string;
    replacedCount: (n: number) => string;
    /** aria-label de la barra (rol search). Opcional; default "Find and replace". */
    ariaLabel?: string;
  };
}

interface Match {
  from: number;
  to: number;
}

/**
 * Inline find/replace bar that sits under the toolbar (mode=full).
 *
 * Implementation:
 *   - Walks the editor's text content with `state.doc.descendants`,
 *     collecting `(from, to)` ranges that match the needle.
 *   - "Find next/prev" sets the editor selection to the matched range
 *     and scrolls it into view.
 *   - "Replace" replaces the active range; "Replace all" walks the list
 *     in reverse (so earlier offsets stay valid) and applies each one.
 *   - Recomputes the match list on doc changes via the editor `update`
 *     event so navigation stays consistent after replacements.
 */
export function FindReplaceBar({ editor, open, onClose, labels }: FindReplaceBarProps) {
  const [needle, setNeedle] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Pre-load the input with the current selection when the bar opens.
  useEffect(() => {
    if (!open) return;
    const { from, to } = editor.state.selection;
    if (to > from) {
      setNeedle(editor.state.doc.textBetween(from, to, ' '));
    }
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, editor]);

  const findMatches = useCallback(
    (q: string, cs: boolean): Match[] => {
      if (!q) return [];
      const target = cs ? q : q.toLowerCase();
      const found: Match[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        const haystack = cs ? node.text : node.text.toLowerCase();
        let idx = 0;
        while ((idx = haystack.indexOf(target, idx)) !== -1) {
          found.push({ from: pos + idx, to: pos + idx + q.length });
          idx += q.length;
        }
      });
      return found;
    },
    [editor],
  );

  // Recompute on every editor update so concurrent edits don't desync.
  useEffect(() => {
    if (!open) return;
    const refresh = () => setMatches(findMatches(needle, caseSensitive));
    refresh();
    editor.on('update', refresh);
    return () => {
      editor.off('update', refresh);
    };
  }, [open, editor, needle, caseSensitive, findMatches]);

  useEffect(() => {
    if (activeIndex >= matches.length) setActiveIndex(Math.max(0, matches.length - 1));
  }, [matches.length, activeIndex]);

  const focusMatch = useCallback(
    (idx: number) => {
      const m = matches[idx];
      if (!m) return;
      editor.chain().setTextSelection({ from: m.from, to: m.to }).scrollIntoView().run();
    },
    [editor, matches],
  );

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (activeIndex + 1) % matches.length;
    setActiveIndex(next);
    focusMatch(next);
  }, [matches.length, activeIndex, focusMatch]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const next = (activeIndex - 1 + matches.length) % matches.length;
    setActiveIndex(next);
    focusMatch(next);
  }, [matches.length, activeIndex, focusMatch]);

  const replaceOne = useCallback(() => {
    const m = matches[activeIndex];
    if (!m) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: m.from, to: m.to })
      .insertContent(replacement)
      .run();
  }, [editor, matches, activeIndex, replacement]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0) return;
    // Apply from the end so earlier (from, to) ranges remain valid.
    const tr = editor.state.tr;
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    for (const m of sorted) {
      tr.insertText(replacement, m.from, m.to);
    }
    editor.view.dispatch(tr);
  }, [editor, matches, replacement]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? goPrev() : goNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const counter = useMemo(() => {
    if (!needle) return '';
    if (matches.length === 0) return labels.none;
    return labels.count(activeIndex + 1, matches.length);
  }, [needle, matches, activeIndex, labels]);

  if (!open) return null;

  return (
    <div className="maya-editor-find" role="search" aria-label={labels.ariaLabel ?? 'Find and replace'}>
      <div className="maya-editor-find__row">
        <input
          ref={inputRef}
          type="text"
          className="maya-editor-find__input"
          placeholder={labels.findPlaceholder}
          value={needle}
          onChange={(e) => setNeedle(e.target.value)}
          onKeyDown={handleKey}
        />
        <span className="maya-editor-find__counter" aria-live="polite">
          {counter}
        </span>
        <button
          type="button"
          className="maya-editor-toolbar__btn"
          onClick={goPrev}
          disabled={matches.length === 0}
          title={labels.findPrev}
          aria-label={labels.findPrev}
        >
          ‹
        </button>
        <button
          type="button"
          className="maya-editor-toolbar__btn"
          onClick={goNext}
          disabled={matches.length === 0}
          title={labels.findNext}
          aria-label={labels.findNext}
        >
          ›
        </button>
        <label
          className={`maya-editor-toolbar__btn${caseSensitive ? ' is-active' : ''}`}
          title={labels.caseSensitive}
        >
          <input
            type="checkbox"
            className="maya-editor-find__hidden"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Aa
        </label>
        <button
          type="button"
          className="maya-editor-toolbar__btn"
          onClick={onClose}
          title={labels.close}
          aria-label={labels.close}
        >
          ✕
        </button>
      </div>
      <div className="maya-editor-find__row">
        <input
          type="text"
          className="maya-editor-find__input"
          placeholder={labels.replacePlaceholder}
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              replaceOne();
              goNext();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        />
        <button
          type="button"
          className="maya-editor-toolbar__btn"
          onClick={replaceOne}
          disabled={matches.length === 0}
          title={labels.replace}
        >
          {labels.replace}
        </button>
        <button
          type="button"
          className="maya-editor-toolbar__btn"
          onClick={replaceAll}
          disabled={matches.length === 0}
          title={labels.replaceAll}
        >
          {labels.replaceAll}
        </button>
      </div>
    </div>
  );
}
