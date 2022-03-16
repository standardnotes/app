import { WebApplication } from '@/ui_models/application';
import { DialogContent, DialogOverlay } from '@reach/dialog';
import { SNFile } from '@standardnotes/snjs';
import { NoPreviewIllustration } from '@standardnotes/stylekit';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { getFileIconComponent } from '../AttachedFilesPopover/PopoverFileItem';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { isFileTypePreviewable } from './isFilePreviewable';

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
  const [isFilePreviewable, setIsFilePreviewable] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const getObjectUrl = useCallback(async () => {
    setIsLoadingFile(true);
    try {
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingFile(false);
    }
  }, [application.files, file]);

  useEffect(() => {
    const isPreviewable = isFileTypePreviewable(file.mimeType);
    setIsFilePreviewable(isPreviewable);

    if (!objectUrl && isPreviewable) {
      getObjectUrl();
    }
  }, [file.mimeType, getObjectUrl, objectUrl]);

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
                application.iconsController.getIconForFileType(file.mimeType),
                'w-6 h-6 flex-shrink-0'
              )}
            </div>
            <span className="ml-3 font-medium">{file.name}</span>
            {/** @TODO Remove mimeType span once the feature is ready */}
            <span className="ml-3">{file.mimeType}</span>
          </div>
          <div className="flex items-center">
            {objectUrl && (
              <Button
                type="primary"
                className="mr-2"
                onClick={() => {
                  application
                    .getArchiveService()
                    .downloadData(objectUrl, file.name);
                }}
              >
                Download
              </Button>
            )}
            <button
              ref={closeButtonRef}
              onClick={onDismiss}
              aria-label="Close modal"
              className="flex p-1 bg-transparent border-0 cursor-pointer"
            >
              <Icon type="close" className="color-neutral" />
            </button>
          </div>
        </div>
        <div className="flex flex-grow items-center justify-center min-h-0">
          {objectUrl ? (
            <object className="w-full h-full" data={objectUrl} />
          ) : isLoadingFile ? (
            <div className="sk-spinner w-5 h-5 spinner-info"></div>
          ) : (
            <div className="flex flex-col items-center">
              <NoPreviewIllustration className="w-30 h-30 mb-4" />
              <div className="font-bold text-base mb-2">
                This file can't be previewed.
              </div>
              {isFilePreviewable ? (
                <>
                  <div className="text-sm text-center color-grey-0 mb-4 max-w-35ch">
                    There was an error loading the file. Try again, or download
                    it and open it using another application.
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="primary"
                      className="mr-3"
                      onClick={() => {
                        getObjectUrl();
                      }}
                    >
                      Try again
                    </Button>
                    <Button
                      type="normal"
                      onClick={() => {
                        application.getAppState().files.downloadFile(file);
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-center color-grey-0 mb-4 max-w-35ch">
                    To view this file, download it and open it using another
                    application.
                  </div>
                  <Button
                    type="primary"
                    onClick={() => {
                      application.getAppState().files.downloadFile(file);
                    }}
                  >
                    Download
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </DialogOverlay>
  );
};
