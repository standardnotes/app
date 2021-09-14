import { FunctionComponent } from 'preact';

const baseClass = `rounded px-4 py-1.75 font-bold text-sm`;

const normalClass = `${baseClass} bg-default color-text border-solid border-gray-300 border-1 \
focus:bg-contrast hover:bg-contrast`;
const primaryClass = `${baseClass} no-border bg-info color-info-contrast hover:brightness-130 \
focus:brightness-130`;

export const Button: FunctionComponent<{
  className?: string;
  type: 'normal' | 'primary';
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isFullWidth?: boolean;
}> = ({
  type,
  label,
  className = '',
  onClick,
  disabled = false,
  isFullWidth = false,
}) => {
  const buttonClass = type === 'primary' ? primaryClass : normalClass;
  const cursorClass = disabled ? 'cursor-default' : 'cursor-pointer';
  const widthClass = isFullWidth ? 'w-full' : 'fit-content';

  return (
    <button
      className={`${buttonClass} ${cursorClass} ${widthClass} ${className}`}
      onClick={(e) => {
        onClick();
        e.preventDefault();
      }}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
