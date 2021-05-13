import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { STRING_SIGN_OUT_CONFIRMATION } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { toDirective } from './utils';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const ConfirmSignoutContainer = observer((props: Props) => {
  if (!props.appState.accountMenu.signingOut) {
    return null;
  }
  return <ConfirmSignoutModal {...props} />;
});

const ConfirmSignoutModal = observer(({ application, appState }: Props) => {
  const [deleteLocalBackups, setDeleteLocalBackups] = useState(
    application.hasAccount()
  );

  const cancelRef = useRef<HTMLButtonElement>();
  function close() {
    appState.accountMenu.setSigningOut(false);
  }

  const [localBackupsCount, setLocalBackupsCount] = useState(0);

  useEffect(() => {
    application.bridge.localBackupsCount().then(setLocalBackupsCount);
  }, [appState.accountMenu.signingOut, application.bridge]);

  return (
    <AlertDialog onDismiss={close} leastDestructiveRef={cancelRef}>
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title capitalize">
                  End your session?
                </AlertDialogLabel>
                <AlertDialogDescription className="sk-panel-row">
                  <p className="color-foreground">
                    {STRING_SIGN_OUT_CONFIRMATION}
                  </p>
                </AlertDialogDescription>
                {localBackupsCount > 0 && (
                  <div className="flex">
                    <div className="sk-panel-row"></div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={deleteLocalBackups}
                        onChange={(event) => {
                          setDeleteLocalBackups(
                            (event.target as HTMLInputElement).checked
                          );
                        }}
                      />
                      <span className="ml-2">
                        Delete {localBackupsCount} local backup file
                        {localBackupsCount > 1 ? 's' : ''}
                      </span>
                    </label>
                    <button
                      className="capitalize sk-a ml-1.5 p-0 rounded cursor-pointer"
                      onClick={() => {
                        application.bridge.viewlocalBackups();
                      }}
                    >
                      View backup files
                    </button>
                  </div>
                )}
                <div className="flex my-1 mt-4">
                  <button
                    className="sn-button small neutral"
                    ref={cancelRef}
                    onClick={close}
                  >
                    Cancel
                  </button>
                  <button
                    className="sn-button small danger ml-2"
                    onClick={() => {
                      if (deleteLocalBackups) {
                        application.signOutAndDeleteLocalBackups();
                      } else {
                        application.signOut();
                      }
                      close();
                    }}
                  >
                    {application.hasAccount()
                      ? 'Sign Out'
                      : 'Clear Session Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlertDialog>
  );
});

export const ConfirmSignoutDirective = toDirective<Props>(
  ConfirmSignoutContainer
);
