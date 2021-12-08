import { AppState } from '@/ui_models/app_state';
import { toDirective } from './utils';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
  appState: AppState;
  onViewNote: () => void;
};

function NoProtectionsNoteWarning({ appState, onViewNote, application }: Props) {
  const user = application.getUser();
  const instructionText = user ? 'Authenticate to view this note.' :
    'Add a passcode or create an account to require authentication to view this note.';

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <h1 className="text-2xl m-0 w-full">This note is protected</h1>
      <p className="text-lg mt-2 w-full">
        {instructionText}
      </p>
      <div className="mt-4 flex gap-3">
        {!user && (
          <button
            className="sn-button small info"
            onClick={() => {
              appState.accountMenu.setShow(true);
            }}
          >
            Open account menu
          </button>
        )}
        <button className="sn-button small outlined" onClick={onViewNote}>
          View note
        </button>
      </div>
    </div>
  );
}

export const NoProtectionsdNoteWarningDirective = toDirective<Props>(
  NoProtectionsNoteWarning,
  {
    onViewNote: '&',
  }
);
