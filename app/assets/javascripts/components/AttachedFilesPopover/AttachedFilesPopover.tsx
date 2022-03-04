import { confirmDialog } from '@/services/alertService';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { ContentType, SNFile, SNNote } from '@standardnotes/snjs';
import {
  addToast,
  dismissToast,
  FilesIllustration,
  ToastType,
} from '@standardnotes/stylekit';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { PopoverFileItem } from './PopoverFileItem';

type Props = {
  application: WebApplication;
  appState: AppState;
  note: SNNote;
};

export const AttachedFilesPopover: FunctionComponent<Props> = observer(
  ({ application, appState, note }) => {
    const [allFiles] = useState(
      () => application.getItems(ContentType.File) as SNFile[]
    );

    const handleAttachFilesClick = () => {
      appState.files.uploadNewFile();
    };

    const deleteFile = useCallback(
      async (file: SNFile) => {
        const shouldDelete = await confirmDialog({
          text: `Do you really want to delete the file "${file.nameWithExt}"?`,
          confirmButtonStyle: 'danger',
        });
        if (shouldDelete) {
          const deletingToastId = addToast({
            type: ToastType.Loading,
            message: `Deleting file "${file.nameWithExt}"...`,
          });
          await application.deleteItem(file);
          addToast({
            type: ToastType.Success,
            message: `Deleted file "${file.nameWithExt}"`,
          });
          dismissToast(deletingToastId);
        }
      },
      [application]
    );

    const downloadFile = useCallback(
      async (file: SNFile) => {
        appState.files.downloadFile(file);
      },
      [appState.files]
    );

    return (
      <div>
        {allFiles.length > 0 ? (
          <>
            {allFiles.map((file: SNFile) => {
              return (
                <PopoverFileItem
                  file={file}
                  downloadFile={downloadFile}
                  deleteFile={deleteFile}
                />
              );
            })}
            <button
              className="sn-dropdown-item py-3 border-0 border-t-1px border-solid border-main"
              onClick={handleAttachFilesClick}
            >
              <Icon type="add" className="mr-2 color-neutral" />
              Attach files
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full py-8">
            <div className="w-18 h-18 mb-2">
              <FilesIllustration
                style={{
                  transform: 'scale(0.6)',
                  transformOrigin: 'top left',
                }}
              />
            </div>
            <div className="text-sm font-medium mb-3">
              No files attached to this note
            </div>
            <Button type="normal" onClick={handleAttachFilesClick}>
              Attach files
            </Button>
          </div>
        )}
      </div>
    );
  }
);
