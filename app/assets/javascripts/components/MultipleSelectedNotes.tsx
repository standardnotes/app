import { AppState } from '@/ui_models/app_state';
import { IlNotesIcon } from '@standardnotes/stylekit';
import { observer } from 'mobx-react-lite';
import { NotesOptionsPanel } from './NotesOptionsPanel';
import { WebApplication } from '@/ui_models/application';
import { PinNoteButton } from './PinNoteButton';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const MultipleSelectedNotes = observer(
  ({ application, appState }: Props) => {
    const count = appState.notes.selectedNotesCount;

    return (
      <div className="flex flex-col h-full items-center">
        <div className="flex items-center justify-between p-4 w-full">
          <h1 className="sk-h1 font-bold m-0">{count} selected notes</h1>
          <div className="flex">
            <div className="mr-3">
              <PinNoteButton appState={appState} />
            </div>
            <NotesOptionsPanel application={application} appState={appState} />
          </div>
        </div>
        <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
          <IlNotesIcon className="block" />
          <h2 className="text-lg m-0 text-center mt-4">
            {count} selected notes
          </h2>
          <p className="text-sm mt-2 text-center max-w-60">
            Actions will be performed on all selected notes.
          </p>
        </div>
      </div>
    );
  }
);
