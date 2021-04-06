import { AppState } from '@/ui_models/app_state';
import { toDirective, useAutorunValue } from './utils';
import { useRef, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { ComponentChildren } from 'preact';
import {
  CustomCheckboxContainer,
  CustomCheckboxInput,
  CustomCheckboxInputProps,
} from '@reach/checkbox';
import '@reach/checkbox/styles.css';
import VisuallyHidden from '@reach/visually-hidden';
import TuneIcon from '../../icons/ic_tune.svg';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import React, { HTMLProps } from 'react';

type Props = {
  appState: AppState;
  application: WebApplication;
};

function Switch(
  props: HTMLProps<HTMLInputElement> & {
    checked?: boolean;
    onChange: (checked: boolean) => void;
    children: ComponentChildren;
  }
) {
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
}

function SearchOptions({ appState }: Props) {
  const { searchOptions } = appState;

  const {
    includeProtectedContents,
    includeArchived,
    includeTrashed,
  } = useAutorunValue(() => ({
    includeProtectedContents: searchOptions.includeProtectedContents,
    includeArchived: searchOptions.includeArchived,
    includeTrashed: searchOptions.includeTrashed,
  }));

  const [
    togglingIncludeProtectedContents,
    setTogglingIncludeProtectedContents,
  ] = useState(false);

  async function toggleIncludeProtectedContents() {
    setTogglingIncludeProtectedContents(true);
    try {
      await searchOptions.toggleIncludeProtectedContents();
    } finally {
      setTogglingIncludeProtectedContents(false);
    }
  }

  const [isOpen, setOpen] = useState(false);
  const [optionsPanelTop, setOptionsPanelTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>();
  const panelRef = useRef<HTMLDivElement>();

  function closeOnBlur(event: React.FocusEvent<HTMLElement>) {
    if (
      !togglingIncludeProtectedContents &&
      !panelRef.current.contains(event.relatedTarget as Node)
    ) {
      setOpen(false);
    }
  }

  return (
    <Disclosure
      open={isOpen}
      onChange={() => {
        const { height } = buttonRef.current.getBoundingClientRect();
        const extraVerticalBreathingRoom = 4;
        setOptionsPanelTop(height + extraVerticalBreathingRoom);
        setOpen(!isOpen);
      }}
    >
      <DisclosureButton
        ref={buttonRef}
        onBlur={closeOnBlur}
        className="sn-icon-button color-neutral hover:color-info"
      >
        <VisuallyHidden>Search options</VisuallyHidden>
        <TuneIcon className="fill-current block" />
      </DisclosureButton>
      <DisclosurePanel
        ref={panelRef}
        style={{
          top: optionsPanelTop,
        }}
        className="sn-dropdown sn-dropdown-anchor-right grid gap-2 py-2"
      >
        <Switch
          checked={includeProtectedContents}
          onChange={toggleIncludeProtectedContents}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include protected contents</p>
        </Switch>
        <Switch
          checked={includeArchived}
          onChange={searchOptions.toggleIncludeArchived}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include archived notes</p>
        </Switch>
        <Switch
          checked={includeTrashed}
          onChange={searchOptions.toggleIncludeTrashed}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include trashed notes</p>
        </Switch>
      </DisclosurePanel>
    </Disclosure>
  );
}

export const SearchOptionsDirective = toDirective<Props>(SearchOptions);
