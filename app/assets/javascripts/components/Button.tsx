import { JSXInternal } from 'preact/src/jsx';
import { ComponentChildren, FunctionComponent, Ref } from 'preact';
import { forwardRef } from 'preact/compat';

const baseClass = `rounded px-4 py-1.75 font-bold text-sm fit-content`;

type ButtonType = 'normal' | 'primary' | 'danger';

const buttonClasses: { [type in ButtonType]: string } = {
  normal: `${baseClass} bg-default color-text border-solid border-main border-1 focus:bg-contrast hover:bg-contrast`,
  primary: `${baseClass} no-border bg-info color-info-contrast hover:brightness-130 focus:brightness-130`,
  danger: `${baseClass} bg-default color-danger border-solid border-main border-1 focus:bg-contrast hover:bg-contrast`,
};

type ButtonProps = JSXInternal.HTMLAttributes<HTMLButtonElement> & {
  children?: ComponentChildren;
  className?: string;
  variant: ButtonType;
  label?: string;
};

export const Button: FunctionComponent<ButtonProps> = forwardRef(
  (
    {
      variant,
      label,
      className = '',
      disabled = false,
      children,
      ...props
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>
  ) => {
    const buttonClass = buttonClasses[variant];
    const cursorClass = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

    return (
      <button
        type="button"
        className={`${buttonClass} ${cursorClass} ${className}`}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {label ?? children}
      </button>
    );
  }
);
