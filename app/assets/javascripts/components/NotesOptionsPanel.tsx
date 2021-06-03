import { AppState } from '@/ui_models/app_state';
import { Icon } from './Icon';
import VisuallyHidden from '@reach/visually-hidden';
import { toDirective, useCloseOnBlur } from './utils';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { useRef, useState } from 'preact/hooks';
import { observer } from 'mobx-react-lite';
import { NotesOptions } from './NotesOptions';

type Props = {
  appState: AppState;
};

export const NotesOptionsPanel = observer(({ appState }: Props) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  });
  const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto');
  const buttonRef = useRef<HTMLButtonElement>();
  const panelRef = useRef<HTMLDivElement>();
  const [closeOnBlur] = useCloseOnBlur(panelRef, setOpen);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const onSubmenuChange = (open: boolean) => {
    setSubmenuOpen(open);
  };

  return (
    <Disclosure
      open={open}
      onChange={() => {
        const rect = buttonRef.current.getBoundingClientRect();
        const { clientHeight } = document.documentElement;
        const footerHeight = 32;
        setMaxHeight(clientHeight - rect.bottom - footerHeight - 2);
        setPosition({
          top: rect.bottom,
          right: document.body.clientWidth - rect.right,
        });
        setOpen(!open);
      }}
    >
      <DisclosureButton
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !submenuOpen) {
            setOpen(false);
          }
        }}
        onBlur={closeOnBlur}
        ref={buttonRef}
        className="sn-icon-button"
      >
        <VisuallyHidden>Actions</VisuallyHidden>
        <Icon type="more" className="block" />
      </DisclosureButton>
        <DisclosurePanel
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !submenuOpen) {
              setOpen(false);
              buttonRef.current.focus();
            }
          }}
          ref={panelRef}
          style={{
            ...position,
            maxHeight
          }}
          className="sn-dropdown sn-dropdown--animated max-h-120 max-w-xs flex flex-col py-2 overflow-y-scroll fixed"
        >
          {open && (
            <NotesOptions
              appState={appState}
              closeOnBlur={closeOnBlur}
              onSubmenuChange={onSubmenuChange}
            />
          )}
        </DisclosurePanel>
    </Disclosure>
  );
});

export const NotesOptionsPanelDirective = toDirective<Props>(NotesOptionsPanel);
