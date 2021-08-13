import { ComponentChildren, FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import { HTMLProps } from 'react';
import {
  CustomCheckboxContainer,
  CustomCheckboxInput,
  CustomCheckboxInputProps,
} from '@reach/checkbox';
import '@reach/checkbox/styles.css';

export type SwitchProps = HTMLProps<HTMLInputElement> & {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  children?: ComponentChildren;
};

export const Switch: FunctionalComponent<SwitchProps> = (
  props: SwitchProps
) => {
  const [checkedState, setChecked] = useState(props.checked || false);
  const checked = props.checked ?? checkedState;
  const className = props.className ?? '';
  return (
    <label
      className={`sn-component flex justify-between items-center cursor-pointer hover:bg-contrast px-3 ${className}`}
    >
      {props.children}
      <CustomCheckboxContainer
        checked={checked}
        onChange={(event) => {
          setChecked(event.target.checked);
          props.onChange(event.target.checked);
        }}
        className={`sn-switch ${checked ? 'bg-info' : 'bg-neutral'}`}
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
