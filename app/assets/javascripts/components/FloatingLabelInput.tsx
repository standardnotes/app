import { FunctionComponent, Ref } from 'preact';
import { JSXInternal } from 'preact/src/jsx';
import { forwardRef } from 'preact/compat';
import { useState } from 'preact/hooks';

type Props = {
  id: string;
  type: 'text' | 'email' | 'password'; // Have no use cases for other types so far
  label: string;
  value: string;
  onChange: JSXInternal.GenericEventHandler<HTMLInputElement>;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  isInvalid?: boolean;
};

export const FloatingLabelInput: FunctionComponent<Props> = forwardRef(
  (
    {
      id,
      type,
      label,
      disabled,
      value,
      isInvalid,
      onChange,
      className = '',
      labelClassName = '',
      inputClassName = '',
    }: Props,
    ref: Ref<HTMLInputElement>
  ) => {
    const [focused, setFocused] = useState(false);

    const BASE_CLASSNAME = `relative bg-default`;

    const LABEL_CLASSNAME = `hidden absolute ${
      !focused ? 'color-neutral' : 'color-info'
    } ${focused || value ? 'flex top-0 left-2 pt-1.5 px-1' : ''} ${
      isInvalid ? 'color-dark-red' : ''
    } ${labelClassName}`;

    const INPUT_CLASSNAME = `w-full h-full ${
      focused || value ? 'pt-6 pb-2' : 'py-2.5'
    } px-3 text-input border-1 border-solid border-neutral rounded placeholder-medium text-input focus:ring-info ${
      isInvalid ? 'border-dark-red placeholder-dark-red' : ''
    } ${inputClassName}`;

    const handleFocus = () => setFocused(true);

    const handleBlur = () => setFocused(false);

    return (
      <div className={`${BASE_CLASSNAME} ${className}`}>
        <label htmlFor={id} className={LABEL_CLASSNAME}>
          {label}
        </label>
        <input
          id={id}
          className={INPUT_CLASSNAME}
          placeholder={!focused ? label : ''}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          disabled={disabled}
        />
      </div>
    );
  }
);
