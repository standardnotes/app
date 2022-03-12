import { KeyboardKey } from '@/services/ioService';
import { formatSizeToReadableString } from '@standardnotes/filepicker';
import { SNFile } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ICONS } from '../Icon';
import {
  PopoverFileItemAction,
  PopoverFileItemActionType,
} from './PopoverFileItemAction';
import { PopoverFileSubmenu } from './PopoverFileSubmenu';

const getIconForFileType = (fileType: string) => {
  let iconType = 'file-other';

  if (fileType === 'pdf') {
    iconType = 'file-pdf';
  }

  if (/^(docx?|odt)/.test(fileType)) {
    iconType = 'file-doc';
  }

  if (/^pptx?/.test(fileType)) {
    iconType = 'file-ppt';
  }

  if (/^(xlsx?|ods)/.test(fileType)) {
    iconType = 'file-xls';
  }

  if (/^(jpe?g|a?png|webp|gif)/.test(fileType)) {
    iconType = 'file-image';
  }

  if (/^(mov|mp4|mkv)/.test(fileType)) {
    iconType = 'file-mov';
  }

  if (/^(wav|mp3|flac|ogg)/.test(fileType)) {
    iconType = 'file-music';
  }

  if (/^(zip|rar|7z)/.test(fileType)) {
    iconType = 'file-zip';
  }

  const IconComponent = ICONS[iconType as keyof typeof ICONS];

  return <IconComponent className="flex-shrink-0" />;
};

export type PopoverFileItemProps = {
  file: SNFile;
  isAttachedToNote: boolean;
  handleFileAction: (action: PopoverFileItemAction) => Promise<boolean>;
};

export const PopoverFileItem: FunctionComponent<PopoverFileItemProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
}) => {
  const [fileName, setFileName] = useState(file.name);
  const [isRenamingFile, setIsRenamingFile] = useState(false);
  const fileNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenamingFile) {
      fileNameInputRef.current?.focus();
    }
  }, [isRenamingFile]);

  const renameFile = async (file: SNFile, name: string) => {
    await handleFileAction({
      type: PopoverFileItemActionType.RenameFile,
      payload: {
        file,
        name,
      },
    });
    setIsRenamingFile(false);
  };

  const handleFileNameInput = (event: Event) => {
    setFileName((event.target as HTMLInputElement).value);
  };

  const handleFileNameInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === KeyboardKey.Enter) {
      fileNameInputRef.current?.blur();
    }
  };

  const handleFileNameInputBlur = () => {
    renameFile(file, fileName);
  };

  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center">
        {getIconForFileType(file.name ?? '')}
        <div className="flex flex-col mx-4">
          {isRenamingFile ? (
            <input
              type="text"
              className="text-input px-1.5 py-1 mb-1 border-1 border-solid border-main bg-transparent color-foreground"
              value={fileName}
              ref={fileNameInputRef}
              onInput={handleFileNameInput}
              onKeyDown={handleFileNameInputKeyDown}
              onBlur={handleFileNameInputBlur}
            />
          ) : (
            <div className="text-sm mb-1">{file.name}</div>
          )}
          <div className="text-xs color-grey-0">
            {file.created_at.toLocaleString()} ·{' '}
            {formatSizeToReadableString(file.size)}
          </div>
        </div>
      </div>
      <PopoverFileSubmenu
        file={file}
        isAttachedToNote={isAttachedToNote}
        handleFileAction={handleFileAction}
        setIsRenamingFile={setIsRenamingFile}
      />
    </div>
  );
};
