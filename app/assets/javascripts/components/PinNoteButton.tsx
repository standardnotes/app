import { AppState } from '@/ui_models/app_state';
import VisuallyHidden from '@reach/visually-hidden';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { Icon } from './Icon';
import { toDirective } from './utils';

type Props = {
  appState: AppState;
  className?: string;
};

export const PinNoteButton: FunctionComponent<Props> = observer(
  ({ appState, className = '' }) => {
    const notes = Object.values(appState.notes.selectedNotes);
    const pinned = notes.some((note) => note.pinned);

    const togglePinned = () => {
      if (!pinned) {
        appState.notes.setPinSelectedNotes(true);
      } else {
        appState.notes.setPinSelectedNotes(false);
      }
    };

    return (
      <button
        className={`sn-icon-button ${pinned ? 'toggled' : ''} ${className}`}
        onClick={togglePinned}
      >
        <VisuallyHidden>Pin selected notes</VisuallyHidden>
        <Icon type="pin" className="block" />
      </button>
    );
  }
);

export const PinNoteButtonDirective = toDirective<Props>(PinNoteButton);
