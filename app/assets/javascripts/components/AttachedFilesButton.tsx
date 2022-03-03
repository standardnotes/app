import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { MENU_MARGIN_FROM_APP_BORDER } from '@/constants';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import VisuallyHidden from '@reach/visually-hidden';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { Icon, ICONS } from './Icon';
import { useCloseOnBlur } from './utils';
import { FilesIllustration } from '@standardnotes/stylekit';
import { Button } from './Button';
import { ContentType, SNFile } from '@standardnotes/snjs';
import { formatSizeToReadableString } from '@/utils';

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

  return <IconComponent />;
};

type Props = {
  application: WebApplication;
  appState: AppState;
  onClickPreprocessing?: () => Promise<void>;
};

export const AttachedFilesButton: FunctionComponent<Props> = observer(
  ({ application, appState, onClickPreprocessing }) => {
    const note = Object.values(appState.notes.selectedNotes)[0];
    const [allFiles] = useState(
      () => application.getItems(ContentType.File) as SNFile[]
    );
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({
      top: 0,
      right: 0,
    });
    const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [closeOnBlur] = useCloseOnBlur(containerRef, () => {
      //
    });

    const toggleAttachedFilesMenu = async () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const { clientHeight } = document.documentElement;
        const footerElementRect = document
          .getElementById('footer-bar')
          ?.getBoundingClientRect();
        const footerHeightInPx = footerElementRect?.height;

        if (footerHeightInPx) {
          setMaxHeight(
            clientHeight -
              rect.bottom -
              footerHeightInPx -
              MENU_MARGIN_FROM_APP_BORDER
          );
        }

        setPosition({
          top: rect.bottom,
          right: document.body.clientWidth - rect.right,
        });

        const newOpenState = !open;
        if (newOpenState && onClickPreprocessing) {
          await onClickPreprocessing();
        }

        setOpen(newOpenState);
      }
    };

    const handleAttachFilesClick = () => {
      appState.files.uploadNewFile();
    };

    return (
      <div ref={containerRef}>
        <Disclosure open={open} onChange={toggleAttachedFilesMenu}>
          <DisclosureButton
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
              }
            }}
            onBlur={closeOnBlur}
            ref={buttonRef}
            className="sn-icon-button border-contrast"
          >
            <VisuallyHidden>Attached files</VisuallyHidden>
            <Icon type="attachment-file" className="block" />
          </DisclosureButton>
          <DisclosurePanel
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
              }
            }}
            ref={panelRef}
            style={{
              ...position,
              maxHeight,
            }}
            className="sn-dropdown sn-dropdown--animated min-w-80 max-h-120 max-w-xs flex flex-col overflow-y-auto fixed"
            onBlur={closeOnBlur}
          >
            {open && (
              <div>
                {allFiles.length > 0 ? (
                  <>
                    {allFiles.map((file) => {
                      return (
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center">
                            {getIconForFileType(file.ext)}
                            <div className="flex flex-col ml-4">
                              <div className="text-sm mb-1">
                                {file.nameWithExt}
                              </div>
                              <div className="text-xs color-grey-0">
                                {file.created_at.toLocaleString()} ·{' '}
                                {formatSizeToReadableString(file.size)}
                              </div>
                            </div>
                          </div>
                          <button className="w-7 h-7 p-1 rounded-full border-0 bg-transparent hover:bg-contrast cursor-pointer">
                            <Icon type="more" className="color-neutral" />
                          </button>
                        </div>
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
            )}
          </DisclosurePanel>
        </Disclosure>
      </div>
    );
  }
);
