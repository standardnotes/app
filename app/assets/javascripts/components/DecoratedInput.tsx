import { FunctionalComponent, ComponentChild } from 'preact';

interface Props {
  type?: string;
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
  const base =
    'rounded py-1.5 px-3 text-input my-1 h-8 flex flex-row items-center gap-4';
  const stateClasses = disabled
    ? 'no-border bg-grey-5'
    : 'border-solid border-1 border-gray-300';
  const classes = `${base} ${stateClasses} ${className}`;

  return (
    <div className={`${classes} focus-within:ring-info`}>
      {left}
      <div className="flex-grow">
        <input
          type={type}
          className="w-full no-border color-black focus:shadow-none"
          disabled={disabled}
          value={text}
          placeholder={placeholder}
          onChange={(e) =>
            onChange && onChange((e.target as HTMLInputElement).value)
          }
        />
      </div>
      {right}
    </div>
  );
};
