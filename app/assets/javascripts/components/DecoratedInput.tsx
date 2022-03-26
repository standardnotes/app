import { FunctionalComponent, ComponentChild, Ref } from 'preact';
import { forwardRef } from 'preact/compat';

export type DecoratedInputProps = {
  type?: 'text' | 'email' | 'password';
  className?: string;
  disabled?: boolean;
  left?: ComponentChild[];
  right?: ComponentChild[];
  value?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  onFocus?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  autocomplete?: boolean;
};

const getClassNames = (
  hasLeftDecorations: boolean,
  hasRightDecorations: boolean
) => {
  return {
    container: `flex items-stretch position-relative bg-default border-1 border-solid border-main rounded focus-within:ring-info overflow-hidden ${
      !hasLeftDecorations && !hasRightDecorations ? 'px-2 py-1.5' : ''
    }`,
    input: `w-full border-0 focus:shadow-none ${
      !hasLeftDecorations && hasRightDecorations ? 'pl-2' : ''
    } ${hasRightDecorations ? 'pr-2' : ''}`,
    disabled: 'bg-grey-5 cursor-not-allowed',
  };
};

/**
 * Input that can be decorated on the left and right side
 */
export const DecoratedInput: FunctionalComponent<DecoratedInputProps> =
  forwardRef(
    (
      {
        type = 'text',
        className = '',
        disabled = false,
        left,
        right,
        value,
        placeholder = '',
        onChange,
        onFocus,
        onKeyDown,
        autocomplete = false,
      }: DecoratedInputProps,
      ref: Ref<HTMLInputElement>
    ) => {
      const hasLeftDecorations = Boolean(left?.length);
      const hasRightDecorations = Boolean(right?.length);
      const classNames = getClassNames(hasLeftDecorations, hasRightDecorations);

      return (
        <div
          className={`${classNames.container} ${
            disabled ? classNames.disabled : ''
          } ${className}`}
        >
          {left && (
            <div className="flex items-center px-2 py-1.5">
              {left.map((leftChild) => (
                <>{leftChild}</>
              ))}
            </div>
          )}
          <input
            type={type}
            className={`${classNames.input} ${
              disabled ? classNames.disabled : ''
            }`}
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onChange={(e) =>
              onChange && onChange((e.target as HTMLInputElement).value)
            }
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            data-lpignore={type !== 'password' ? true : false}
            autocomplete={autocomplete ? 'on' : 'off'}
            ref={ref}
          />
          {right && (
            <div className="flex items-center px-2 py-1.5">
              {right.map((rightChild, index) => (
                <div className={index > 0 ? 'ml-3' : ''}>{rightChild}</div>
              ))}
            </div>
          )}
        </div>
      );
    }
  );
