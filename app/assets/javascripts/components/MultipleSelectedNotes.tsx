import { AppState } from '@/ui_models/app_state';
import VisuallyHidden from '@reach/visually-hidden';
import { toDirective, useCloseOnBlur } from './utils';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import MoreIcon from '../../icons/ic-more.svg';
import PencilOffIcon from '../../icons/ic-pencil-off.svg';
import RichTextIcon from '../../icons/ic-text-rich.svg';
import TrashIcon from '../../icons/ic-trash.svg';
import PinIcon from '../../icons/ic-pin.svg';
import UnpinIcon from '../../icons/ic-pin-off.svg';
import ArchiveIcon from '../../icons/ic-archive.svg';
import UnarchiveIcon from '../../icons/ic-unarchive.svg';
import NotesIcon from '../../icons/il-notes.svg';
import { useRef, useState } from 'preact/hooks';
import { Switch } from './Switch';
import { observer } from 'mobx-react-lite';
import { SNApplication } from '@standardnotes/snjs';

type Props = {
  application: SNApplication;
  appState: AppState;
};

const MultipleSelectedNotes = observer(({ appState }: Props) => {
  const count = appState.notes.selectedNotesCount;
  const [open, setOpen] = useState(false);
  const [optionsPanelPosition, setOptionsPanelPosition] = useState({
    top: 0,
    right: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>();
  const panelRef = useRef<HTMLDivElement>();
  const [closeOnBlur, setLockCloseOnBlur] = useCloseOnBlur(panelRef, setOpen);

  const notes = Object.values(appState.notes.selectedNotes);
  const hidePreviews = !notes.some((note) => !note.hidePreview);
  const locked = !notes.some((note) => !note.locked);
  const archived = !notes.some((note) => !note.archived);
  const trashed = !notes.some((note) => !note.trashed);
  const pinned = !notes.some((note) => !note.pinned);

  const iconClass = 'fill-current color-neutral mr-2.5';
  const buttonClass =
    'flex items-center border-0 capitalize focus:inner-ring-info ' +
    'cursor-pointer hover:bg-contrast color-text bg-transparent h-10 px-3 ' +
    'text-left';

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="text-3xl m-0">{count} selected notes</h1>
        <Disclosure
          open={open}
          onChange={() => {
            const rect = buttonRef.current.getBoundingClientRect();
            setOptionsPanelPosition({
              top: rect.bottom,
              right: document.body.clientWidth - rect.right,
            });
            setOpen((prevOpen) => !prevOpen);
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
              ...optionsPanelPosition,
            }}
            className="sn-dropdown sn-dropdown-anchor-right flex flex-col py-2 select-none"
          >
            <Switch
              onBlur={closeOnBlur}
              className="h-10"
              checked={locked}
              onChange={() => {
                appState.notes.setLockSelectedNotes(!locked);
              }}
            >
              <span className="capitalize flex items-center">
                <PencilOffIcon className={iconClass} />
                Prevent editing
              </span>
            </Switch>
            <Switch
              onBlur={closeOnBlur}
              className="h-10"
              checked={!hidePreviews}
              onChange={() => {
                appState.notes.setHideSelectedNotePreviews(!hidePreviews);
              }}
            >
              <span className="capitalize flex items-center">
                <RichTextIcon className={iconClass} />
                Show Preview
              </span>
            </Switch>
            <div className="h-1px my-2.5 bg-secondary-contrast"></div>
            <button
              onBlur={closeOnBlur}
              className={buttonClass}
              onClick={() => {
                appState.notes.setPinSelectedNotes(!pinned);
              }}
            >
              {pinned ? (
                <>
                  <UnpinIcon className={iconClass} />
                  Unpin notes
                </>
              ) : (
                <>
                  <PinIcon className={iconClass} />
                  Pin notes
                </>
              )}
            </button>
            <button
              onBlur={closeOnBlur}
              className={buttonClass}
              onClick={() => {
                appState.notes.setArchiveSelectedNotes(!archived);
              }}
            >
              {archived ? (
                <>
                  <UnarchiveIcon className={iconClass} />
                  Unarchive
                </>
              ) : (
                <>
                  <ArchiveIcon className={iconClass} />
                  Archive
                </>
              )}
            </button>
            <button
              onBlur={closeOnBlur}
              className={buttonClass}
              onClick={async () => {
                setLockCloseOnBlur(true);
                await appState.notes.setTrashSelectedNotes(!trashed);
                setLockCloseOnBlur(false);
              }}
            >
              <TrashIcon className={iconClass} />
              {trashed ? 'Restore' : 'Move to trash'}
            </button>
          </DisclosurePanel>
        </Disclosure>
      </div>
      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
        <NotesIcon className="block" />
        <h2 className="text-2xl m-0 text-center mt-4">
          {count} selected notes
        </h2>
        <p className="text-lg mt-2 text-center">
          Actions will be performed on all selected notes.
        </p>
      </div>
    </div>
  );
});

export const MultipleSelectedNotesDirective = toDirective<Props>(
  MultipleSelectedNotes
);
