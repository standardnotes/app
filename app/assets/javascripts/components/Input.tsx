import { FunctionalComponent } from 'preact';

interface Props {
  text?: string;
  disabled?: boolean;
  className?: string;
}

export const Input: FunctionalComponent<Props> = ({
  className = '',
  disabled = false,
  text,
}) => {
  const base = `rounded py-1.5 px-3 text-input my-1 h-8`;
  const stateClasses = disabled
    ? 'no-border bg-grey-5'
    : 'border-solid border-1 border-gray-300';
  const classes = `${base} ${stateClasses} ${className}`;
  return (
    <input type="text" className={classes} disabled={disabled} value={text} />
  );
};
