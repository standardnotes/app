import { AppState } from '@/ui_models/app_state';
import PencilOffIcon from '../../icons/ic-pencil-off.svg';
import RichTextIcon from '../../icons/ic-text-rich.svg';
import TrashIcon from '../../icons/ic-trash.svg';
import PinIcon from '../../icons/ic-pin.svg';
import UnpinIcon from '../../icons/ic-pin-off.svg';
import ArchiveIcon from '../../icons/ic-archive.svg';
import UnarchiveIcon from '../../icons/ic-unarchive.svg';
import { Switch } from './Switch';
import { observer } from 'mobx-react-lite';
import { useRef } from 'preact/hooks';

type Props = {
  appState: AppState;
  closeOnBlur: (event: {
    relatedTarget: EventTarget | null;
    target: EventTarget | null;
  }) => void;
  setLockCloseOnBlur: (lock: boolean) => void;
};

export const NotesOptions = observer(
  ({ appState, closeOnBlur, setLockCloseOnBlur }: Props) => {
    const notes = Object.values(appState.notes.selectedNotes);
    const hidePreviews = !notes.some((note) => !note.hidePreview);
    const locked = !notes.some((note) => !note.locked);
    const archived = !notes.some((note) => !note.archived);
    const trashed = !notes.some((note) => !note.trashed);
    const pinned = !notes.some((note) => !note.pinned);

    const trashButtonRef = useRef<HTMLButtonElement>();

    const iconClass = 'fill-current color-neutral mr-2.5';
    const buttonClass =
      'flex items-center border-0 capitalize focus:inner-ring-info ' +
      'cursor-pointer hover:bg-contrast color-text bg-transparent h-10 px-3 ' +
      'text-left';

    return (
      <>
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
          ref={trashButtonRef}
          onBlur={closeOnBlur}
          className={buttonClass}
          onClick={async () => {
            setLockCloseOnBlur(true);
            await appState.notes.setTrashSelectedNotes(!trashed, trashButtonRef);
            setLockCloseOnBlur(false);
          }}
        >
          <TrashIcon className={iconClass} />
          {trashed ? 'Restore' : 'Move to trash'}
        </button>
      </>
    );
  }
);
