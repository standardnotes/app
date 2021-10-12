import { JSXInternal } from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;

import { FunctionComponent } from 'preact';

const baseClass = `rounded px-4 py-1.75 font-bold text-sm fit-content`;

type ButtonType = 'normal' | 'primary' | 'danger';

const buttonClasses: { [type in ButtonType]: string } = {
  normal: `${baseClass} bg-default color-text border-neutral border-solid border-gray-300 border-1 focus:bg-contrast hover:bg-contrast`,
  primary: `${baseClass} no-border bg-info color-info-contrast hover:brightness-130 focus:brightness-130`,
  danger: `${baseClass} bg-default color-danger border-neutral border-solid border-gray-300 border-1 focus:bg-contrast hover:bg-contrast`,
};

export const Button: FunctionComponent<{
  className?: string;
  type: ButtonType;
  label: string;
  onClick: (event: TargetedEvent<HTMLFormElement> | TargetedMouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}> = ({ type, label, className = '', onClick, disabled = false }) => {
  const buttonClass = buttonClasses[type];
  const cursorClass = disabled ? 'cursor-default' : 'cursor-pointer';

  return (
    <button
      className={`${buttonClass} ${cursorClass} ${className}`}
      onClick={(e) => {
        onClick(e);
        e.preventDefault();
      }}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
