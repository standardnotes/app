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
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Icon, ICONS } from '../Icon';
import { Switch } from '../Switch';
import { useCloseOnBlur } from '../utils';

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

type Props = {
  file: SNFile;
  downloadFile: (file: SNFile) => Promise<void>;
  deleteFile: (file: SNFile) => Promise<void>;
};

const PopoverFileSubmenu: FunctionComponent<Props> = ({
  file,
  downloadFile,
  deleteFile,
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const renameFile = () => {
    //
  };

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
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item"
                onClick={() => {
                  //
                }}
              >
                <Icon type="link" className="mr-2 color-neutral" />
                Attach to note
              </button>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item"
                onClick={() => {
                  //
                }}
              >
                <Icon type="link-off" className="mr-2 color-neutral" />
                Detach from note
              </button>
              <div className="min-h-1px my-1 bg-border"></div>
              <button
                className="sn-dropdown-item justify-between"
                onClick={() => {
                  /** @TODO */
                }}
                onBlur={closeOnBlur}
              >
                <span className="flex items-center">
                  <Icon type="password" className="mr-2 color-neutral" />
                  Password protection
                </span>
                <Switch className="px-0" checked={false} />
              </button>
              <div className="min-h-1px my-1 bg-border"></div>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item"
                onClick={() => {
                  downloadFile(file);
                  closeMenu();
                }}
              >
                <Icon type="download" className="mr-2 color-neutral" />
                Download
              </button>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item"
                onClick={renameFile}
              >
                <Icon type="pencil" className="mr-2 color-neutral" />
                Rename
              </button>
              <button
                onBlur={closeOnBlur}
                className="sn-dropdown-item"
                onClick={() => {
                  deleteFile(file);
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

export const PopoverFileItem: FunctionComponent<Props> = ({
  file,
  downloadFile,
  deleteFile,
}) => {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center">
        {getIconForFileType(file.ext)}
        <div className="flex flex-col mx-4">
          <div className="text-sm mb-1">{file.nameWithExt}</div>
          <div className="text-xs color-grey-0">
            {file.created_at.toLocaleString()} ·{' '}
            {formatSizeToReadableString(file.size)}
          </div>
        </div>
      </div>
      <PopoverFileSubmenu
        file={file}
        deleteFile={deleteFile}
        downloadFile={downloadFile}
      />
    </div>
  );
};
