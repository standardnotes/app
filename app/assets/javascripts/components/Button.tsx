import { JSXInternal } from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;

import { FunctionComponent, Ref } from 'preact';
import { forwardRef } from 'preact/compat';

const baseClass = `rounded px-4 py-1.75 font-bold text-sm fit-content`;

type ButtonType = 'normal' | 'primary' | 'danger';

const buttonClasses: { [type in ButtonType]: string } = {
  normal: `${baseClass} bg-default color-text border-solid border-main border-1 focus:bg-contrast hover:bg-contrast`,
  primary: `${baseClass} no-border bg-info color-info-contrast hover:brightness-130 focus:brightness-130`,
  danger: `${baseClass} bg-default color-danger border-solid border-main border-1 focus:bg-contrast hover:bg-contrast`,
};

type ButtonProps = {
  className?: string;
  type: ButtonType;
  label: string;
  onClick: (
    event:
      | TargetedEvent<HTMLFormElement>
      | TargetedMouseEvent<HTMLButtonElement>
  ) => void;
  disabled?: boolean;
};

export const Button: FunctionComponent<ButtonProps> = forwardRef(
  (
    { type, label, className = '', onClick, disabled = false }: ButtonProps,
    ref: Ref<HTMLButtonElement>
  ) => {
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
        ref={ref}
      >
        {label}
      </button>
    );
  }
);
