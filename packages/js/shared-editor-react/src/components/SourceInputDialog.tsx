import { useEffect, useRef, useState } from 'react';

interface SourceInputDialogProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * Lightweight modal used by the "Insert HTML" and "Insert Markdown"
 * toolbar actions. Renders a sticky overlay with a textarea so power
 * users can paste/edit source instead of clicking through the toolbar.
 *
 * Intentionally dependency-free: no portal, no headless-ui — the
 * package targets multiple consumers (DMS, logs, dashboard) with
 * different UI kits and shouldn't pull a modal lib transitively.
 */
export function SourceInputDialog({
  open,
  title,
  description,
  placeholder,
  initialValue = '',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: SourceInputDialogProps) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      // Defer focus to next tick — React mounts the textarea after the open prop flips.
      const t = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="maya-editor-dialog-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="maya-editor-dialog">
        <header className="maya-editor-dialog__header">
          <h3 className="maya-editor-dialog__title">{title}</h3>
          <button
            type="button"
            className="maya-editor-dialog__close"
            aria-label={cancelLabel}
            onClick={onCancel}
          >
            ✕
          </button>
        </header>
        {description && <p className="maya-editor-dialog__description">{description}</p>}
        <textarea
          ref={textareaRef}
          className="maya-editor-dialog__textarea"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          spellCheck={false}
        />
        <footer className="maya-editor-dialog__footer">
          <button
            type="button"
            className="maya-editor-dialog__btn maya-editor-dialog__btn--ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="maya-editor-dialog__btn maya-editor-dialog__btn--primary"
            onClick={() => onConfirm(value)}
            disabled={value.trim() === ''}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
