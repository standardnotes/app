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
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { PopoverFileItem } from './PopoverFileItem';

enum Tabs {
  AttachedFiles,
  AllFiles,
}

type Props = {
  application: WebApplication;
  appState: AppState;
  note: SNNote;
};

export const AttachedFilesPopover: FunctionComponent<Props> = observer(
  ({ application, appState, note }) => {
    const [currentTab, setCurrentTab] = useState(Tabs.AttachedFiles);
    const [attachedFiles, setAttachedFiles] = useState<SNFile[]>([]);
    const [allFiles, setAllFiles] = useState<SNFile[]>([]);

    const currentListOfFiles =
      currentTab === Tabs.AttachedFiles ? attachedFiles : allFiles;

    const reloadAttachedFiles = useCallback(() => {
      setAttachedFiles(
        application.items
          .getFilesForNote(note)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      );
    }, [application.items, note]);

    useEffect(() => {
      reloadAttachedFiles();
    }, [reloadAttachedFiles]);

    const reloadAllFiles = useCallback(() => {
      setAllFiles(
        application
          .getItems(ContentType.File)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) as SNFile[]
      );
    }, [application]);

    useEffect(() => {
      reloadAllFiles();
    }, [reloadAllFiles]);

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

    const attachFileToNote = useCallback(
      async (file: SNFile) => {
        await application.items.associateFileWithNote(file, note);
        reloadAttachedFiles();
        reloadAllFiles();
      },
      [application.items, note, reloadAllFiles, reloadAttachedFiles]
    );

    const detachFileFromNote = useCallback(
      async (file: SNFile) => {
        await application.items.disassociateFileWithNote(file, note);
        reloadAttachedFiles();
        reloadAllFiles();
      },
      [application.items, note, reloadAllFiles, reloadAttachedFiles]
    );

    const handleAttachFilesClick = async () => {
      const uploadedFile = await appState.files.uploadNewFile();
      if (!uploadedFile) {
        addToast({
          type: ToastType.Error,
          message: 'Could not upload file',
        });
        return;
      }
      if (currentTab === Tabs.AttachedFiles) {
        attachFileToNote(uploadedFile);
      }
    };

    return (
      <div className="flex flex-col">
        <div className="flex border-0 border-b-1 border-solid border-main">
          <button
            className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
              currentTab === Tabs.AttachedFiles
                ? 'color-info font-medium shadow-bottom'
                : 'color-text'
            }`}
            onClick={() => {
              setCurrentTab(Tabs.AttachedFiles);
            }}
          >
            Attached
          </button>
          <button
            className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
              currentTab === Tabs.AllFiles
                ? 'color-info font-medium shadow-bottom'
                : 'color-text'
            }`}
            onClick={() => {
              setCurrentTab(Tabs.AllFiles);
            }}
          >
            All files
          </button>
        </div>
        <div className="min-h-0 max-h-110 overflow-y-auto">
          {currentListOfFiles.length > 0 ? (
            <>
              {currentListOfFiles.map((file: SNFile) => {
                return (
                  <PopoverFileItem
                    file={file}
                    isAttachedToNote={attachedFiles.includes(file)}
                    attachFileToNote={attachFileToNote}
                    detachFileFromNote={detachFileFromNote}
                    deleteFile={deleteFile}
                    downloadFile={downloadFile}
                  />
                );
              })}
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
                {currentTab === Tabs.AttachedFiles
                  ? 'No files attached to this note'
                  : 'No files found in this account'}
              </div>
              <Button type="normal" onClick={handleAttachFilesClick}>
                {currentTab === Tabs.AttachedFiles ? 'Attach' : 'Upload'} files
              </Button>
            </div>
          )}
        </div>
        {currentListOfFiles.length > 0 && (
          <button
            className="sn-dropdown-item py-3 border-0 border-t-1px border-solid border-main"
            onClick={handleAttachFilesClick}
          >
            <Icon type="add" className="mr-2 color-neutral" />
            {currentTab === Tabs.AttachedFiles ? 'Attach' : 'Upload'} files
          </button>
        )}
      </div>
    );
  }
);
