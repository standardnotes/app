import { AppState } from '@/ui_models/app_state';
import { Icon, IconType } from './Icon';
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

    const iconClass = 'fill-current color-neutral mr-2';
    const buttonClass =
      'flex items-center border-0 focus:inner-ring-info ' +
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
          <span className="flex items-center">
            <Icon type={IconType.PencilOff} className={iconClass} />
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
          <span className="flex items-center">
            <Icon type={IconType.RichText} className={iconClass} />
            Show preview
          </span>
        </Switch>
        <div className="h-1px my-2 bg-secondary-contrast"></div>
        <button
          onBlur={closeOnBlur}
          className={buttonClass}
          onClick={() => {
            appState.notes.setPinSelectedNotes(!pinned);
          }}
        >
          <Icon type={pinned ? IconType.Unpin : IconType.Pin} className={iconClass} />
          {pinned ? 'Unpin notes' : 'Pin notes'}
        </button>
        <button
          onBlur={closeOnBlur}
          className={buttonClass}
          onClick={() => {
            appState.notes.setArchiveSelectedNotes(!archived);
          }}
        >
          <Icon type={archived ? IconType.Unarchive : IconType.Archive} className={iconClass} />
          {archived ? 'Unarchive' : 'Archive'}
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
          <Icon type={IconType.Trash} className={iconClass} />
          {trashed ? 'Restore' : 'Move to Trash'}
        </button>
      </>
    );
  }
);
