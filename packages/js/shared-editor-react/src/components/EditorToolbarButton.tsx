/**
 * Toolbar button component used across EditorToolbar and its button groups.
 */
interface BtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

export function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: BtnProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ? 'true' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`maya-editor-toolbar__btn${active ? ' is-active' : ''}`}
    >
      {children}
    </button>
  );
}
