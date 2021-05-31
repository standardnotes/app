import { AppState } from '@/ui_models/app_state';
import { toDirective } from './utils';

type Props = { appState: AppState; onViewNote: () => void };

function NoProtectionsNoteWarning({ appState, onViewNote }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <h1 className="text-2xl m-0 w-full">This note is protected</h1>
      <p className="text-lg mt-2 w-full">
        Add a passcode or create an account to require authentication to view
        this note.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          className="sn-button small info"
          onClick={() => {
            appState.accountMenu.setShow(true);
            appState.accountMenuReact.setShow(true);
          }}
        >
          Open account menu
        </button>
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
