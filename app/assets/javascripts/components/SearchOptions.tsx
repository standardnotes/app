import { AppState } from '@/ui_models/app_state';
import { Icon } from './Icon';
import { toDirective, useCloseOnBlur } from './utils';
import { useRef, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import VisuallyHidden from '@reach/visually-hidden';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { Switch } from './Switch';
import { observer } from 'mobx-react-lite';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const SearchOptions = observer(({ appState }: Props) => {
  const { searchOptions } = appState;

  const {
    includeProtectedContents,
    includeArchived,
    includeTrashed,
  } = searchOptions;

  const [open, setOpen] = useState(false);
  const [optionsPanelTop, setOptionsPanelTop] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>();
  const panelRef = useRef<HTMLDivElement>();
  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(panelRef, setOpen);

  async function toggleIncludeProtectedContents() {
    setLockCloseOnBlur(true);
    try {
      await searchOptions.toggleIncludeProtectedContents();
    } finally {
      setLockCloseOnBlur(false);
    }
  }

  return (
    <Disclosure
      open={open}
      onChange={() => {
        const { height } = buttonRef.current.getBoundingClientRect();
        setOptionsPanelTop(height);
        setOpen((prevOpen) => !prevOpen);
      }}
    >
      <DisclosureButton
        ref={buttonRef}
        onBlur={closeOnBlur}
        className="border-0 p-0 bg-transparent cursor-pointer color-neutral hover:color-info"
      >
        <VisuallyHidden>Search options</VisuallyHidden>
        <Icon type="tune" className="block" />
      </DisclosureButton>
      <DisclosurePanel
        ref={panelRef}
        style={{
          top: optionsPanelTop,
        }}
        className="sn-dropdown sn-dropdown--anchor-right sn-dropdown--animated absolute grid gap-2 py-2"
      >
        <Switch
          className="h-10"
          checked={includeProtectedContents}
          onChange={toggleIncludeProtectedContents}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include protected contents</p>
        </Switch>
        <Switch
          className="h-10"
          checked={includeArchived}
          onChange={searchOptions.toggleIncludeArchived}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include archived notes</p>
        </Switch>
        <Switch
          className="h-10"
          checked={includeTrashed}
          onChange={searchOptions.toggleIncludeTrashed}
          onBlur={closeOnBlur}
        >
          <p className="capitalize">Include trashed notes</p>
        </Switch>
      </DisclosurePanel>
    </Disclosure>
  );
});

export const SearchOptionsDirective = toDirective<Props>(SearchOptions);
