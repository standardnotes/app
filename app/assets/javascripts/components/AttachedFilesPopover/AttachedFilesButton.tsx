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
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon';
import { useCloseOnClickOutside } from '../utils';
import { ChallengeReason, ContentType, SNFile } from '@standardnotes/snjs';
import { confirmDialog } from '@/services/alertService';
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit';
import { parseFileName } from '@standardnotes/filepicker';
import {
  PopoverFileItemAction,
  PopoverFileItemActionType,
} from './PopoverFileItemAction';
import { PopoverDragNDropWrapper } from './PopoverDragNDropWrapper';

type Props = {
  application: WebApplication;
  appState: AppState;
  onClickPreprocessing?: () => Promise<void>;
};

export const AttachedFilesButton: FunctionComponent<Props> = observer(
  ({ application, appState, onClickPreprocessing }) => {
    const note = Object.values(appState.notes.selectedNotes)[0];

    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({
      top: 0,
      right: 0,
    });
    const [maxHeight, setMaxHeight] = useState<number | 'auto'>('auto');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    useCloseOnClickOutside(containerRef, () => {
      setOpen(false);
    });

    const [attachedFilesCount, setAttachedFilesCount] = useState(
      note ? application.items.getFilesForNote(note).length : 0
    );

    const reloadAttachedFilesCount = useCallback(() => {
      setAttachedFilesCount(application.items.getFilesForNote(note).length);
    }, [application.items, note]);

    useEffect(() => {
      const unregisterFileStream = application.streamItems(
        ContentType.File,
        () => {
          reloadAttachedFilesCount();
        }
      );

      return () => {
        unregisterFileStream();
      };
    }, [application, reloadAttachedFilesCount]);

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

    const deleteFile = async (file: SNFile) => {
      const shouldDelete = await confirmDialog({
        text: `Are you sure you want to permanently delete "${file.nameWithExt}"?`,
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
    };

    const downloadFile = async (file: SNFile) => {
      appState.files.downloadFile(file);
    };

    const attachFileToNote = async (file: SNFile) => {
      await application.items.associateFileWithNote(file, note);
    };

    const detachFileFromNote = async (file: SNFile) => {
      await application.items.disassociateFileWithNote(file, note);
    };

    const toggleFileProtection = async (file: SNFile) => {
      let result: SNFile | undefined;
      if (file.protected) {
        result = await application.protections.unprotectFile(file);
      } else {
        result = await application.protections.protectFile(file);
      }
      const isProtected = result ? result.protected : file.protected;
      return isProtected;
    };

    const authorizeProtectedActionForFile = async (
      file: SNFile,
      challengeReason: ChallengeReason
    ) => {
      const authorizedFiles =
        await application.protections.authorizeProtectedActionForFiles(
          [file],
          challengeReason
        );
      const isAuthorized =
        authorizedFiles.length > 0 && authorizedFiles.includes(file);
      return isAuthorized;
    };

    const renameFile = async (file: SNFile, fileName: string) => {
      const { name, ext } = parseFileName(fileName);
      await application.items.renameFile(file, name, ext);
    };

    const handleFileAction = async (action: PopoverFileItemAction) => {
      const file =
        action.type !== PopoverFileItemActionType.RenameFile
          ? action.payload
          : action.payload.file;
      let isAuthorizedForAction = true;

      if (
        file.protected &&
        action.type !== PopoverFileItemActionType.ToggleFileProtection
      ) {
        isAuthorizedForAction = await authorizeProtectedActionForFile(
          file,
          ChallengeReason.AccessProtectedFile
        );
      }

      if (!isAuthorizedForAction) {
        return false;
      }

      switch (action.type) {
        case PopoverFileItemActionType.AttachFileToNote:
          await attachFileToNote(file);
          break;
        case PopoverFileItemActionType.DetachFileToNote:
          await detachFileFromNote(file);
          break;
        case PopoverFileItemActionType.DeleteFile:
          await deleteFile(file);
          break;
        case PopoverFileItemActionType.DownloadFile:
          await downloadFile(file);
          break;
        case PopoverFileItemActionType.ToggleFileProtection: {
          const isProtected = await toggleFileProtection(file);
          action.callback(isProtected);
          break;
        }
        case PopoverFileItemActionType.RenameFile:
          await renameFile(file, action.payload.name);
          break;
      }

      application.sync.sync();

      return true;
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
            ref={buttonRef}
            className={`sn-icon-button border-contrast ${
              attachedFilesCount > 0 ? 'py-1 px-3' : ''
            }`}
          >
            <VisuallyHidden>Attached files</VisuallyHidden>
            <Icon type="attachment-file" className="block" />
            {attachedFilesCount > 0 && (
              <span className="ml-2">{attachedFilesCount}</span>
            )}
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
          >
            {open && (
              <PopoverDragNDropWrapper
                application={application}
                appState={appState}
                note={note}
                fileActionHandler={handleFileAction}
              />
            )}
          </DisclosurePanel>
        </Disclosure>
      </div>
    );
  }
);
