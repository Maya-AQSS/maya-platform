import { useEffect, useRef, useState } from 'react';

interface ColorPickerProps {
  title: string;
  /** Currently applied colour (used for the swatch indicator + state). */
  value?: string | null;
  /** Called with a 6-digit hex or `null` (clear). */
  onSelect: (color: string | null) => void;
  /** Glyph shown inside the trigger button (e.g. `A` for text, `▮` for bg). */
  glyph: React.ReactNode;
  clearLabel?: string;
}

const PALETTE: Array<{ value: string | null; label: string }> = [
  { value: null, label: 'Default' },
  { value: '#000000', label: 'Black' },
  { value: '#5b5b5b', label: 'Grey' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#10b981', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#a16207', label: 'Brown' },
];

/**
 * Lightweight palette popover used by the editor toolbar for text colour
 * and highlight (background) selection. Closes on outside click, Escape,
 * or after a swatch is chosen.
 */
export function ColorPicker({ title, value, onSelect, glyph, clearLabel = 'Default' }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = !!value;

  return (
    <div className="maya-editor-color" ref={wrapperRef}>
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-pressed={isActive ? 'true' : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`maya-editor-toolbar__btn maya-editor-color__btn${isActive ? ' is-active' : ''}`}
      >
        <span className="maya-editor-color__glyph">{glyph}</span>
        <span
          className="maya-editor-color__swatch"
          style={value ? { background: value } : undefined}
          aria-hidden
        />
      </button>
      {open && (
        <div className="maya-editor-color__panel" role="menu">
          {PALETTE.map((item) => (
            <button
              key={item.value ?? '__default__'}
              type="button"
              role="menuitem"
              className={`maya-editor-color__cell${value === item.value ? ' is-active' : ''}`}
              title={item.value === null ? clearLabel : item.label}
              aria-label={item.value === null ? clearLabel : item.label}
              onClick={() => {
                onSelect(item.value);
                setOpen(false);
              }}
              style={
                item.value === null
                  ? { backgroundImage: 'linear-gradient(45deg, transparent 47%, #d33 47%, #d33 53%, transparent 53%)' }
                  : { background: item.value }
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
