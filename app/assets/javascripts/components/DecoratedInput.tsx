import { FunctionalComponent, ComponentChild } from 'preact';
import { HtmlInputTypes } from '@/enums';

interface Props {
  type?: HtmlInputTypes;
  className?: string;
  disabled?: boolean;
  left?: ComponentChild[];
  right?: ComponentChild[];
  text?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
}

/**
 * Input that can be decorated on the left and right side
 */
export const DecoratedInput: FunctionalComponent<Props> = ({
  type = 'text',
  className = '',
  disabled = false,
  left,
  right,
  text,
  placeholder = '',
  onChange,
}) => {
  const baseClasses =
    'rounded py-1.5 px-3 text-input my-1 h-8 flex flex-row items-center';
  const stateClasses = disabled
    ? 'no-border bg-grey-5'
    : 'border-solid border-1 border-gray-300';
  const classes = `${baseClasses} ${stateClasses} ${className}`;

  const inputBaseClasses = 'w-full no-border color-black focus:shadow-none';
  const inputStateClasses = disabled ? 'overflow-ellipsis' : '';
  return (
    <div className={`${classes} focus-within:ring-info`}>
      {left?.map((leftChild) => (
        <>
          {leftChild}
          <div className="w-4" />
        </>
      ))}
      <div className="flex-grow">
        <input
          type={type}
          className={`${inputBaseClasses} ${inputStateClasses}`}
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) =>
            onChange && onChange((e.target as HTMLInputElement).value)
          }
        />
      </div>
      {right?.map((rightChild) => (
        <>
          <div className="w-4" />
          {rightChild}
        </>
      ))}
    </div>
  );
};
