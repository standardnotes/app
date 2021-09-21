import { useRef, useState } from 'preact/hooks';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const OtherSessionsLogoutContainer = observer((props: Props) => {
  if (!props.appState.accountMenu.otherSessionsLogOut) {
    return null;
  }
  return <ConfirmOtherSessionsLogout {...props} />;
});

const SessionsLogoutSuccess: FunctionComponent<{ closeDialog: () => void }> = ({ closeDialog }) => {
  const cancelRevokeRef = useRef<HTMLButtonElement>();
  return <AlertDialog
    onDismiss={() => {
      closeDialog();
    }}
    leastDestructiveRef={cancelRevokeRef}
  >
    <div className="sk-modal-content">
      <div className="sn-component">
        <div className="sk-panel">
          <div className="sk-panel-content">
            <div className="sk-panel-section">
              <AlertDialogDescription className="sk-panel-row mt-1">
                You have successfully revoked your sessions from other devices.
              </AlertDialogDescription>
              <div className="flex my-1 gap-2">
                <button
                  className="sn-button small info mt-4 sk-label"
                  ref={cancelRevokeRef}
                  onClick={() => closeDialog()}
                >
                  <span>Finish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AlertDialog>;
};

const ConfirmOtherSessionsLogout = observer(
  ({ application, appState }: Props) => {
    const [hasLoggedOut, setHasLoggedOut] = useState(false);

    const cancelRef = useRef<HTMLButtonElement>();
    function closeDialog() {
      appState.accountMenu.setOtherSessionsLogout(false);
    }

    return hasLoggedOut ? <SessionsLogoutSuccess closeDialog={closeDialog} /> :
      <AlertDialog onDismiss={closeDialog} leastDestructiveRef={cancelRef}>
        <div className="sk-modal-content">
          <div className="sn-component">
            <div className="sk-panel">
              <div className="sk-panel-content">
                <div className="sk-panel-section">
                  <AlertDialogLabel className="sk-h3 sk-panel-section-title capitalize">
                    End all other sessions?
                  </AlertDialogLabel>
                  <AlertDialogDescription className="sk-panel-row">
                    <p className="color-foreground">
                      This action will sign out all other devices signed into your account,
                      and remove your data from those devices when they next regain connection
                      to the internet. You may sign back in on those devices at any time.
                    </p>
                  </AlertDialogDescription>
                  <div className="flex my-1 mt-4">
                    <button
                      className="sn-button small neutral"
                      ref={cancelRef}
                      onClick={closeDialog}
                    >
                      Cancel
                    </button>
                    <button
                      className="sn-button small danger ml-2"
                      onClick={() => {
                        application.revokeAllOtherSessions();
                        setHasLoggedOut(true);
                      }}
                    >
                      End Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AlertDialog>;
  }
);
