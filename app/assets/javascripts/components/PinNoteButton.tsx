import { AppState } from '@/ui_models/app_state';
import VisuallyHidden from '@reach/visually-hidden';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { Icon } from './Icon';

type Props = {
  appState: AppState;
  className?: string;
  onClickPreprocessing?: () => Promise<void>;
};

export const PinNoteButton: FunctionComponent<Props> = observer(
  ({ appState, className = '', onClickPreprocessing }) => {
    const notes = Object.values(appState.notes.selectedNotes);
    const pinned = notes.some((note) => note.pinned);

    const togglePinned = async () => {
      if (onClickPreprocessing) {
        await onClickPreprocessing();
      }
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
