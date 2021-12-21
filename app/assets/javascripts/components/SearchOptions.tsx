import { AppState } from '@/ui_models/app_state';
import { Icon } from './Icon';
import { toDirective, useCloseOnBlur } from './utils';
import { useEffect, useRef, useState } from 'preact/hooks';
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

  const { includeProtectedContents, includeArchived, includeTrashed } =
    searchOptions;

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  });
  const [maxWidth, setMaxWidth] = useState<number | 'auto'>('auto');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(
    panelRef as any,
    setOpen
  );

  async function toggleIncludeProtectedContents() {
    setLockCloseOnBlur(true);
    try {
      await searchOptions.toggleIncludeProtectedContents();
    } finally {
      setLockCloseOnBlur(false);
    }
  }

  const updateWidthAndPosition = () => {
    const rect = buttonRef.current!.getBoundingClientRect();
    setMaxWidth(rect.right - 16);
    setPosition({
      top: rect.bottom,
      right: document.body.clientWidth - rect.right,
    });
  };

  useEffect(() => {
    window.addEventListener('resize', updateWidthAndPosition);
    return () => {
      window.removeEventListener('resize', updateWidthAndPosition);
    };
  }, []);

  return (
    <Disclosure
      open={open}
      onChange={() => {
        updateWidthAndPosition();
        setOpen(!open);
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
          ...position,
          maxWidth,
        }}
        className="sn-dropdown sn-dropdown--animated w-80 fixed grid gap-2 py-2"
        onBlur={closeOnBlur}
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
