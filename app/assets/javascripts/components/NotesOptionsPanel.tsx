import { AppState } from '@/ui_models/app_state';
import VisuallyHidden from '@reach/visually-hidden';
import { toDirective, useCloseOnBlur } from './utils';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import MoreIcon from '../../icons/ic-more.svg';
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
  const buttonRef = useRef<HTMLButtonElement>();
  const panelRef = useRef<HTMLDivElement>();
  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(panelRef, setOpen);

  return (
    <Disclosure
      open={open}
      onChange={() => {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom,
          right: document.body.clientWidth - rect.right,
        });
        setOpen(!open);
      }}
    >
      <DisclosureButton
        onKeyUp={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        onBlur={closeOnBlur}
        ref={buttonRef}
        className={
          'bg-transparent border-solid border-1 border-gray-300 ' +
          'cursor-pointer w-32px h-32px rounded-full p-0 ' +
          'flex justify-center items-center'
        }
      >
        <VisuallyHidden>Actions</VisuallyHidden>
        <MoreIcon className="fill-current block" />
      </DisclosureButton>
      <DisclosurePanel
        onKeyUp={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            buttonRef.current.focus();
          }
        }}
        ref={panelRef}
        style={{
          ...position,
        }}
        className="sn-dropdown sn-dropdown-anchor-right flex flex-col py-2"
      >
        <NotesOptions
          appState={appState}
          closeOnBlur={closeOnBlur}
          setLockCloseOnBlur={setLockCloseOnBlur}
        />
      </DisclosurePanel>
    </Disclosure>
  );
});

export const NotesOptionsPanelDirective = toDirective<Props>(NotesOptionsPanel);
