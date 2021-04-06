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
  children: ComponentChildren;
};

export const Switch: FunctionalComponent<SwitchProps> = (
  props: SwitchProps
) => {
  const [checkedState, setChecked] = useState(props.checked || false);
  const checked = props.checked ?? checkedState;
  return (
    <label className="sn-component flex justify-between items-center cursor-pointer hover:bg-contrast py-2 px-3">
      {props.children}
      <CustomCheckboxContainer
        checked={props.checked != null ? props.checked : checked}
        onChange={(event) => {
          setChecked(event.target.checked);
          props.onChange(event.target.checked);
        }}
        className={`sn-switch ${checked ? 'bg-info' : 'bg-secondary-contrast'}`}
      >
        <CustomCheckboxInput
          {...({
            ...props,
            children: undefined,
          } as CustomCheckboxInputProps)}
        />
        <span
          aria-hidden
          className={`sn-switch-handle ${
            checked ? 'sn-switch-handle-right' : ''
          }`}
        />
      </CustomCheckboxContainer>
    </label>
  );
};
