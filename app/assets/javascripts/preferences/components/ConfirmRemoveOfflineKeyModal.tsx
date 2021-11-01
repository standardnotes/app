import { observer } from '@node_modules/mobx-react-lite';
import { useRef } from '@node_modules/preact/hooks';
import { AlertDialog, AlertDialogDescription, AlertDialogLabel } from '@node_modules/@reach/alert-dialog';
import { STRING_REMOVE_OFFLINE_KEY_CONFIRMATION } from '@/strings';
import { AppState } from '@/ui_models/app_state';

type Props = {
  appState: AppState;
  handleRemove: () => Promise<void>;
};

export const ConfirmRemoveOfflineKeyContainer = observer((props: Props) => {
  if (!props.appState.preferences.isRemovingOfflineKey) {
    return null;
  }
  return <ConfirmRemoveOfflineKeyModal {...props} />;
});

const ConfirmRemoveOfflineKeyModal = observer(({ appState, handleRemove }: Props) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const closeDialog = () => {
    appState.preferences.setIsRemovingOfflineKey(false);
  };

  return (
    <AlertDialog onDismiss={closeDialog} leastDestructiveRef={cancelRef}>
      <div className="sk-modal-content">
        <div className="sn-component">
          <div className="sk-panel">
            <div className="sk-panel-content">
              <div className="sk-panel-section">
                <AlertDialogLabel className="sk-h3 sk-panel-section-title capitalize">
                  Remove offline key?
                </AlertDialogLabel>
                <AlertDialogDescription className="sk-panel-row">
                  <p className="color-foreground">
                    {STRING_REMOVE_OFFLINE_KEY_CONFIRMATION}
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
                    onClick={async () => {
                      await handleRemove();
                      closeDialog();
                    }}
                  >
                    Remove Offline Key
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
