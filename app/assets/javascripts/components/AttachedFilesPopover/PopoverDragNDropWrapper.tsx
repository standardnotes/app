import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/constants';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { StreamingFileReader } from '@standardnotes/filepicker';
import { SNNote } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { AttachedFilesPopover } from './AttachedFilesPopover';
import {
  PopoverFileItemAction,
  PopoverFileItemActionType,
} from './PopoverFileItemAction';

export enum PopoverTabs {
  AttachedFiles,
  AllFiles,
}

export type PopoverWrapperProps = {
  application: WebApplication;
  appState: AppState;
  note: SNNote;
  fileActionHandler: (action: PopoverFileItemAction) => Promise<boolean>;
};

export const PopoverDragNDropWrapper: FunctionComponent<
  PopoverWrapperProps
> = ({ fileActionHandler, appState, application, note }) => {
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [currentTab, setCurrentTab] = useState(PopoverTabs.AttachedFiles);
  const dragCounter = useRef(0);

  const handleDrag = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragIn = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = dragCounter.current + 1;

    if (event.dataTransfer?.items.length) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current = dragCounter.current - 1;

    if (dragCounter.current > 0) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragging(false);

      if (event.dataTransfer?.items.length) {
        Array.from(event.dataTransfer.items).forEach(async (item) => {
          let fileOrHandle;
          if (StreamingFileReader.available()) {
            fileOrHandle =
              (await item.getAsFileSystemHandle()) as FileSystemFileHandle;
          } else {
            fileOrHandle = item.getAsFile();
          }
          if (fileOrHandle) {
            const uploadedFile = await appState.files.uploadNewFile(
              fileOrHandle
            );
            if (!uploadedFile) {
              return;
            }
            if (currentTab === PopoverTabs.AttachedFiles) {
              fileActionHandler({
                type: PopoverFileItemActionType.AttachFileToNote,
                payload: uploadedFile,
              });
            }
          }
        });

        event.dataTransfer.clearData();
        dragCounter.current = 0;
      }
    },
    [appState.files, currentTab, fileActionHandler]
  );

  useEffect(() => {
    const dropzoneElement = dropzoneRef.current;

    if (dropzoneElement) {
      dropzoneElement.addEventListener('dragenter', handleDragIn);
      dropzoneElement.addEventListener('dragleave', handleDragOut);
      dropzoneElement.addEventListener('dragover', handleDrag);
      dropzoneElement.addEventListener('drop', handleDrop);
    }

    return () => {
      dropzoneElement?.removeEventListener('dragenter', handleDragIn);
      dropzoneElement?.removeEventListener('dragleave', handleDragOut);
      dropzoneElement?.removeEventListener('dragover', handleDrag);
      dropzoneElement?.removeEventListener('drop', handleDrop);
    };
  }, [handleDrop]);

  return (
    <div
      ref={dropzoneRef}
      className="focus:shadow-none"
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      style={{
        border: isDragging ? '2px dashed var(--sn-stylekit-info-color)' : '',
      }}
    >
      <AttachedFilesPopover
        application={application}
        appState={appState}
        note={note}
        fileActionHandler={fileActionHandler}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
    </div>
  );
};
