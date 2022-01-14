import {
  CustomCheckboxContainer,
  CustomCheckboxInput,
  CustomCheckboxInputProps,
} from '@reach/checkbox';
import '@reach/checkbox/styles.css';
import { ComponentChildren, FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { HTMLProps } from 'react';

export type SwitchProps = HTMLProps<HTMLInputElement> & {
  checked?: boolean;
  // Optional in case it is wrapped in a button (e.g. a menu item)
  onChange?: (checked: boolean) => void;
  className?: string;
  children?: ComponentChildren;
  role?: string;
};

export const Switch: FunctionalComponent<SwitchProps> = (
  props: SwitchProps
) => {
  const [checkedState, setChecked] = useState(props.checked || false);
  const checked = props.checked ?? checkedState;
  const className = props.className ?? '';

  const isDisabled = !!props.disabled;
  const isActive = checked && !isDisabled;

  return (
    <label
      className={`sn-component flex justify-between items-center cursor-pointer px-3 ${className}`}
      style={{opacity: isDisabled ? 0.5 : 1.0}}
      {...(props.role ? { role: props.role } : {})}
    >
      {props.children}
      <CustomCheckboxContainer
        checked={checked}
        onChange={(event) => {
          setChecked(event.target.checked);
          props.onChange?.(event.target.checked);
        }}
        className={`sn-switch ${isActive ? 'bg-info' : 'bg-neutral'}`}
        disabled={props.disabled}
      >
        <CustomCheckboxInput
          {...({
            ...props,
            className: undefined,
            children: undefined,
          } as CustomCheckboxInputProps)}
        />
        <span
          aria-hidden
          className={`sn-switch-handle ${
            checked ? 'sn-switch-handle--right' : ''
          }`}
        />
      </CustomCheckboxContainer>
    </label>
  );
};
