import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/constants';
import {
  calculateSubmenuStyle,
  SubmenuStyle,
} from '@/utils/calculateSubmenuStyle';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { FunctionComponent } from 'preact';
import {
  StateUpdater,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';
import { Icon } from '../Icon';
import { Switch } from '../Switch';
import { useCloseOnBlur } from '../utils';
import {
  PopoverFileItemActionType,
  PopoverFileItemProps,
} from './PopoverFileItem';

type Props = Omit<PopoverFileItemProps, 'renameFile'> & {
  setIsRenamingFile: StateUpdater<boolean>;
};

export const PopoverFileSubmenu: FunctionComponent<Props> = ({
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
