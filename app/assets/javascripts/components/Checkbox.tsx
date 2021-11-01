import { FunctionComponent } from 'preact';

type CheckboxProps = {
  name: string;
  checked: boolean;
  onChange: (e: Event) => void;
  disabled?: boolean;
  label: string;
};

export const Checkbox: FunctionComponent<CheckboxProps> = ({
  name,
  checked,
  onChange,
  disabled,
  label,
}) => {
  return (
    <label htmlFor={name} className="flex items-center fit-content mb-2">
      <input
        className="mr-2"
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      {label}
    </label>
  );
};
