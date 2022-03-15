import { WebApplication } from '@/ui_models/application';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import { SNFile } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { getFileIconComponent } from '../AttachedFilesPopover/PopoverFileItem';
import { Icon } from '../Icon';

type Props = {
  application: WebApplication;
  file: SNFile;
  onDismiss: () => void;
};

export const FilePreviewModal: FunctionComponent<Props> = ({
  application,
  file,
  onDismiss,
}) => {
  const [objectUrl, setObjectUrl] = useState<string>();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const getObjectUrl = async () => {
      await application.files.downloadFile(
        file,
        (decryptedBytes: Uint8Array) => {
          setObjectUrl(
            URL.createObjectURL(
              new Blob([decryptedBytes], {
                type: file.mimeType?.length ? file.mimeType : 'text/plain',
              })
            )
          );
        }
      );
    };

    if (!objectUrl) {
      getObjectUrl();
    }
  }, [application.files, file, objectUrl]);

  return (
    <DialogOverlay
      className="sn-component"
      aria-label="File preview modal"
      onDismiss={onDismiss}
      initialFocusRef={closeButtonRef}
    >
      <DialogContent
        className="flex flex-col rounded shadow-overlay"
        style={{
          width: '90%',
          maxWidth: '90%',
          minHeight: '90%',
          background: 'var(--sn-stylekit-background-color)',
        }}
      >
        <div className="flex flex-shrink-0 justify-between items-center min-h-6 px-4 py-3 border-0 border-b-1 border-solid border-main">
          <div className="flex items-center">
            <div className="w-6 h-6">
              {getFileIconComponent(
                application.iconsController.getIconForFileType(file.mimeType)
              )}
            </div>
            <span className="ml-3 font-medium">{file.name}</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onDismiss}
            aria-label="Close modal"
            className="flex p-1 bg-transparent border-0 cursor-pointer"
          >
            <Icon type="close" className="color-neutral" />
          </button>
        </div>
        <div className="flex flex-grow items-center justify-center">
          {objectUrl ? (
            <object className="w-full h-full" data={objectUrl} />
          ) : (
            <div className="w-5 h-5 sk-spinner spinner-info" />
          )}
        </div>
      </DialogContent>
    </DialogOverlay>
  );
};
