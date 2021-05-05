import { AppState } from '@/ui_models/app_state';
import { toDirective } from './utils';
import NotesIcon from '../../icons/il-notes.svg';
import { observer } from 'mobx-react-lite';
import { NotesOptionsPanel } from './NotesOptionsPanel';

type Props = {
  appState: AppState;
};

const MultipleSelectedNotes = observer(({ appState }: Props) => {
  const count = appState.notes.selectedNotesCount;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex items-center justify-between p-4 w-full">
        <h1 className="sk-h1 font-semibold m-0">{count} selected notes</h1>
        <NotesOptionsPanel appState={appState} />
      </div>
      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
        <NotesIcon className="block" />
        <h2 className="text-2xl m-0 text-center mt-4">
          {count} selected notes
        </h2>
        <p className="text-lg mt-2 text-center max-w-80">
          Actions will be performed on all selected notes.
        </p>
      </div>
    </div>
  );
});

export const MultipleSelectedNotesDirective = toDirective<Props>(
  MultipleSelectedNotes
);
