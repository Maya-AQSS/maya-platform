import { useEffect, useRef, useState } from 'react';

/**
 * Nombres de color inyectables (title/aria-label de cada swatch). Todos
 * opcionales: si se omiten, se usa el default en inglés. Como este paquete
 * NO depende de react-i18next, el consumidor traduce pasando `colorLabels`,
 * p.ej. construyéndolo con `t('editor.colors.*')`:
 *
 * ```tsx
 * <ColorPicker colorLabels={{ red: t('editor.colors.red'), … }} … />
 * ```
 */
export interface ColorLabels {
  default?: string;
  black?: string;
  grey?: string;
  red?: string;
  orange?: string;
  yellow?: string;
  green?: string;
  cyan?: string;
  blue?: string;
  purple?: string;
  pink?: string;
  brown?: string;
}

const DEFAULT_COLOR_LABELS: Required<ColorLabels> = {
  default: 'Default',
  black: 'Black',
  grey: 'Grey',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  cyan: 'Cyan',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  brown: 'Brown',
};

interface ColorPickerProps {
  title: string;
  /** Currently applied colour (used for the swatch indicator + state). */
  value?: string | null;
  /** Called with a 6-digit hex or `null` (clear). */
  onSelect: (color: string | null) => void;
  /** Glyph shown inside the trigger button (e.g. `A` for text, `▮` for bg). */
  glyph: React.ReactNode;
  clearLabel?: string;
  /** Nombres de color traducidos (opcional; default en inglés). */
  colorLabels?: ColorLabels;
}

const PALETTE: Array<{ value: string | null; key: keyof ColorLabels }> = [
  { value: null, key: 'default' },
  { value: '#000000', key: 'black' },
  { value: '#5b5b5b', key: 'grey' },
  { value: '#ef4444', key: 'red' },
  { value: '#f97316', key: 'orange' },
  { value: '#f59e0b', key: 'yellow' },
  { value: '#10b981', key: 'green' },
  { value: '#06b6d4', key: 'cyan' },
  { value: '#3b82f6', key: 'blue' },
  { value: '#8b5cf6', key: 'purple' },
  { value: '#ec4899', key: 'pink' },
  { value: '#a16207', key: 'brown' },
];

/**
 * Lightweight palette popover used by the editor toolbar for text colour
 * and highlight (background) selection. Closes on outside click, Escape,
 * or after a swatch is chosen.
 */
export function ColorPicker({ title, value, onSelect, glyph, clearLabel = 'Default', colorLabels }: ColorPickerProps) {
  const labels = { ...DEFAULT_COLOR_LABELS, ...colorLabels };
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
          {PALETTE.map((item) => {
            const colorName = labels[item.key] ?? DEFAULT_COLOR_LABELS[item.key];
            return (
            <button
              key={item.value ?? '__default__'}
              type="button"
              role="menuitem"
              className={`maya-editor-color__cell${value === item.value ? ' is-active' : ''}`}
              title={item.value === null ? clearLabel : colorName}
              aria-label={item.value === null ? clearLabel : colorName}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
