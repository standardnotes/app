import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/constants';
import { KeyboardKey } from '@/services/ioService';
import { formatSizeToReadableString } from '@/utils';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { SNFile } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import {
  StateUpdater,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { Icon, ICONS } from '../Icon';
import { Switch } from '../Switch';
import { useCloseOnBlur } from '../utils';

export enum PopoverFileItemActionType {
  AttachFileToNote,
  DetachFileToNote,
  DeleteFile,
  DownloadFile,
  RenameFile,
  ProtectFile,
  UnprotectFile,
}

export type PopoverFileItemAction =
  | {
      type: Exclude<
        PopoverFileItemActionType,
        PopoverFileItemActionType.RenameFile
      >;
      payload: SNFile;
    }
  | {
      type: PopoverFileItemActionType.RenameFile;
      payload: {
        file: SNFile;
        name: string;
      };
    };

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

type PopoverFileItemProps = {
  file: SNFile;
  isAttachedToNote: boolean;
  handleFileAction: (action: PopoverFileItemAction) => Promise<void>;
};

type PopoverFileSubmenuProps = Omit<PopoverFileItemProps, 'renameFile'> & {
  setIsRenamingFile: StateUpdater<boolean>;
};

const PopoverFileSubmenu: FunctionComponent<PopoverFileSubmenuProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
  setIsRenamingFile,
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFileProtected, setIsFileProtected] = useState(file.protected);
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  });
  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, setIsMenuOpen);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      const menuPosition = calculateSubmenuStyle(menuButtonRef.current);
      if (menuPosition) {
        setMenuStyle(menuPosition);
      }
    }

    setIsMenuOpen(!isMenuOpen);
  };

  const recalculateMenuStyle = useCallback(() => {
    const newMenuPosition = calculateSubmenuStyle(
      menuButtonRef.current,
      menuRef.current
    );

    if (newMenuPosition) {
      setMenuStyle(newMenuPosition);
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        recalculateMenuStyle();
      });
    }
  }, [isMenuOpen, recalculateMenuStyle]);

  return (
    <div ref={menuContainerRef}>
      <Disclosure open={isMenuOpen} onChange={toggleMenu}>
        <DisclosureButton
          ref={menuButtonRef}
          onBlur={closeOnBlur}
          className="w-7 h-7 p-1 rounded-full border-0 bg-transparent hover:bg-contrast cursor-pointer"
        >
          <Icon type="more" className="color-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className="sn-dropdown flex flex-col max-h-120 min-w-60 py-1 fixed overflow-y-auto"
        >
          {isMenuOpen && (
            <>
              {isAttachedToNote ? (
                <button
                  onBlur={closeOnBlur}
                  className="sn-dropdown-item focus:bg-info-backdrop"
                  onClick={() => {
                    handleFileAction({
                      type: PopoverFileItemActionType.DetachFileToNote,
                      payload: file,
                    });
                    closeMenu();
                  }}
                >
                  <Icon type="link-off" className="mr-2 color-neutral" />
                  Detach from note
                </button>
              ) : (
                <button
                  onBlur={closeOnBlur}
                  className="sn-dropdown-item focus:bg-info-backdrop"
                  onClick={() => {
                    handleFileAction({
                      type: PopoverFileItemActionType.AttachFileToNote,
                      payload: file,
                    });
                    closeMenu();
                  }}
                >
                  <Icon type="link" className="mr-2 color-neutral" />
                  Attach to note
                </button>
              )}
              <div className="min-h-1px my-1 bg-border"></div>
              <button
                className="sn-dropdown-item justify-between focus:bg-info-backdrop"
                onClick={() => {
                  if (isFileProtected) {
                    handleFileAction({
                      type: PopoverFileItemActionType.UnprotectFile,
                      payload: file,
                    });
                  } else {
                    handleFileAction({
                      type: PopoverFileItemActionType.ProtectFile,
                      payload: file,
                    });
                  }
                  setIsFileProtected(!isFileProtected);
                }}
                onBlur={closeOnBlur}
              >
                <span className="flex items-center">
                  <Icon type="password" className="mr-2 color-neutral" />
                  Password protection
                </span>
                <Switch
                  className="px-0 pointer-events-none"
                  tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
                  checked={isFileProtected}
                />
              </button>
              <div className="min-h-1px my-1 bg-border"></div>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item focus:bg-info-backdrop"
                onClick={() => {
                  handleFileAction({
                    type: PopoverFileItemActionType.DownloadFile,
                    payload: file,
                  });
                  closeMenu();
                }}
              >
                <Icon type="download" className="mr-2 color-neutral" />
                Download
              </button>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item focus:bg-info-backdrop"
                onClick={() => {
                  setIsRenamingFile(true);
                }}
              >
                <Icon type="pencil" className="mr-2 color-neutral" />
                Rename
              </button>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item focus:bg-info-backdrop"
                onClick={() => {
                  handleFileAction({
                    type: PopoverFileItemActionType.DeleteFile,
                    payload: file,
                  });
                  closeMenu();
                }}
              >
                <Icon type="trash" className="mr-2 color-danger" />
                <span className="color-danger">Delete permanently</span>
              </button>
            </>
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
};

export const PopoverFileItem: FunctionComponent<PopoverFileItemProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
}) => {
  const [fileName, setFileName] = useState(file.nameWithExt);
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
      renameFile(file, fileName);
      return;
    }
  };

  const handleFileNameInputBlur = () => {
    renameFile(file, fileName);
  };

  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center">
        {getIconForFileType(file.ext ?? '')}
        <div className="flex flex-col mx-4">
          {isRenamingFile ? (
            <input
              type="text"
              className="text-input p-0 mb-1 border-0 bg-transparent color-foreground"
              value={fileName}
              ref={fileNameInputRef}
              onInput={handleFileNameInput}
              onKeyDown={handleFileNameInputKeyDown}
              onBlur={handleFileNameInputBlur}
            />
          ) : (
            <div className="text-sm mb-1">{fileName}</div>
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
