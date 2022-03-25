import { WebApplication } from '@/ui_models/application';
import { SNFile } from '@standardnotes/snjs';
import { createContext, FunctionComponent } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { FilePreviewModal } from './FilePreviewModal';

type FilePreviewModalContextData = {
  activate: (file: SNFile) => void;
};

const FilePreviewModalContext =
  createContext<FilePreviewModalContextData | null>(null);

export const useFilePreviewModal = (): FilePreviewModalContextData => {
  const value = useContext(FilePreviewModalContext);

  if (!value) {
    throw new Error('FilePreviewModalProvider not found.');
  }

  return value;
};

export const FilePreviewModalProvider: FunctionComponent<{
  application: WebApplication;
}> = ({ application, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<SNFile>();

  const activate = (file: SNFile) => {
    setFile(file);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && file && (
        <FilePreviewModal
          application={application}
          file={file}
          onDismiss={close}
        />
      )}
      <FilePreviewModalContext.Provider value={{ activate }}>
        {children}
      </FilePreviewModalContext.Provider>
    </>
  );
};
