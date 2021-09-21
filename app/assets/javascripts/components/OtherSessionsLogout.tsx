import { useRef } from 'preact/hooks';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogLabel,
} from '@reach/alert-dialog';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';

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

const ConfirmOtherSessionsLogout = observer(
  ({ application, appState }: Props) => {

    const cancelRef = useRef<HTMLButtonElement>();
    function close() {
      appState.accountMenu.setOtherSessionsLogout(false);
    }

    return (
      <AlertDialog onDismiss={close} leastDestructiveRef={cancelRef}>
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
                      The associated apps will be signed out and all data removed from the
                      device when it is next launched. You can sign back in on that device at
                      any time.
                    </p>
                  </AlertDialogDescription>
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
                        application.revokeAllOtherSessions();
                        close();
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AlertDialog>
    );
  }
);
