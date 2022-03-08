import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { ContentType, SNFile, SNNote } from '@standardnotes/snjs';
import {
  addToast,
  FilesIllustration,
  ToastType,
} from '@standardnotes/stylekit';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { PopoverFileItem } from './PopoverFileItem';
import {
  PopoverFileItemAction,
  PopoverFileItemActionType,
} from './PopoverFileItemAction';

enum Tabs {
  AttachedFiles,
  AllFiles,
}

type Props = {
  application: WebApplication;
  appState: AppState;
  note: SNNote;
  fileActionHandler: (action: PopoverFileItemAction) => Promise<void>;
};

export const AttachedFilesPopover: FunctionComponent<Props> = observer(
  ({ application, appState, note, fileActionHandler }) => {
    const [currentTab, setCurrentTab] = useState(Tabs.AttachedFiles);
    const [attachedFiles, setAttachedFiles] = useState<SNFile[]>([]);
    const [allFiles, setAllFiles] = useState<SNFile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filesList =
      currentTab === Tabs.AttachedFiles ? attachedFiles : allFiles;

    const filteredList =
      searchQuery.length > 0
        ? filesList.filter(
            (file) => file.nameWithExt.toLowerCase().indexOf(searchQuery) !== -1
          )
        : filesList;

    const reloadAttachedFiles = useCallback(() => {
      setAttachedFiles(
        application.items
          .getFilesForNote(note)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      );
    }, [application.items, note]);

    useEffect(() => {
      reloadAttachedFiles();
    }, [reloadAttachedFiles]);

    const reloadAllFiles = useCallback(() => {
      setAllFiles(
        application
          .getItems(ContentType.File)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) as SNFile[]
      );
    }, [application]);

    useEffect(() => {
      reloadAllFiles();
    }, [reloadAllFiles]);

    const handleFileAction = async (action: PopoverFileItemAction) => {
      await fileActionHandler(action);
      reloadAttachedFiles();
      reloadAllFiles();
    };

    const handleAttachFilesClick = async () => {
      const uploadedFile = await appState.files.uploadNewFile();
      if (!uploadedFile) {
        return;
      }
      if (currentTab === Tabs.AttachedFiles) {
        handleFileAction({
          type: PopoverFileItemActionType.AttachFileToNote,
          payload: uploadedFile,
        });
      }
      reloadAttachedFiles();
      reloadAllFiles();
    };

    return (
      <div className="flex flex-col">
        <div className="flex border-0 border-b-1 border-solid border-main">
          <button
            className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
              currentTab === Tabs.AttachedFiles
                ? 'color-info font-medium shadow-bottom'
                : 'color-text'
            }`}
            onClick={() => {
              setCurrentTab(Tabs.AttachedFiles);
            }}
          >
            Attached
          </button>
          <button
            className={`bg-default border-0 cursor-pointer px-3 py-2.5 relative focus:shadow-inner ${
              currentTab === Tabs.AllFiles
                ? 'color-info font-medium shadow-bottom'
                : 'color-text'
            }`}
            onClick={() => {
              setCurrentTab(Tabs.AllFiles);
            }}
          >
            All files
          </button>
        </div>
        <div className="min-h-0 max-h-110 overflow-y-auto">
          {filteredList.length > 0 || searchQuery.length > 0 ? (
            <div className="sticky top-0 left-0 p-3 bg-default border-0 border-b-1 border-solid border-main">
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded py-1.5 px-3 text-input bg-default border-solid border-1 border-main"
                  placeholder="Search files..."
                  value={searchQuery}
                  onInput={(e) => {
                    setSearchQuery((e.target as HTMLInputElement).value);
                  }}
                />
                {searchQuery.length > 0 && (
                  <button
                    className="flex absolute right-2 p-0 bg-transparent border-0 top-1/2 -translate-y-1/2 cursor-pointer"
                    onClick={() => {
                      setSearchQuery('');
                    }}
                  >
                    <Icon
                      type="clear-circle-filled"
                      className="color-neutral"
                    />
                  </button>
                )}
              </div>
            </div>
          ) : null}
          {filteredList.length > 0 ? (
            filteredList.map((file: SNFile) => {
              return (
                <PopoverFileItem
                  key={file.uuid}
                  file={file}
                  isAttachedToNote={attachedFiles.includes(file)}
                  handleFileAction={handleFileAction}
                />
              );
            })
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
                {searchQuery.length > 0
                  ? "Couldn't find the files you searched..."
                  : currentTab === Tabs.AttachedFiles
                  ? 'No files attached to this note'
                  : 'No files found in this account'}
              </div>
              <Button type="normal" onClick={handleAttachFilesClick}>
                {currentTab === Tabs.AttachedFiles ? 'Attach' : 'Upload'} files
              </Button>
            </div>
          )}
        </div>
        {filteredList.length > 0 && (
          <button
            className="sn-dropdown-item py-3 border-0 border-t-1px border-solid border-main focus:bg-info-backdrop"
            onClick={handleAttachFilesClick}
          >
            <Icon type="add" className="mr-2 color-neutral" />
            {currentTab === Tabs.AttachedFiles ? 'Attach' : 'Upload'} files
          </button>
        )}
      </div>
    );
  }
);
