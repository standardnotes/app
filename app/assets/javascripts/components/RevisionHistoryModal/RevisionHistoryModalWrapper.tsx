import { confirmDialog } from '@/services/alertService';
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { getPlatformString } from '@/utils';
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogLabel,
  AlertDialogOverlay,
} from '@reach/alert-dialog';
import VisuallyHidden from '@reach/visually-hidden';
import {
  ButtonType,
  ContentType,
  HistoryEntry,
  PayloadContent,
  PayloadSource,
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { Button } from '../Button';
import { HistoryListContainer } from './HistoryListContainer';
import { RevisionContentLocked } from './RevisionContentLocked';
import { SelectedRevisionContent } from './SelectedRevisionContent';
import {
  LegacyHistoryEntry,
  RemoteRevisionListGroup,
  sortRevisionListIntoGroups,
} from './utils';

type RevisionHistoryModalProps = {
  application: WebApplication;
  appState: AppState;
};

const ABSOLUTE_CENTER_CLASSNAME =
  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

type RevisionContentPlaceholderProps = {
  isFetchingSelectedRevision: boolean;
  selectedRevision: HistoryEntry | LegacyHistoryEntry | undefined;
  showContentLockedScreen: boolean;
};

const RevisionContentPlaceholder: FunctionComponent<
  RevisionContentPlaceholderProps
> = ({
  isFetchingSelectedRevision,
  selectedRevision,
  showContentLockedScreen,
}) => (
  <div
    className={`absolute w-full h-full top-0 left-0 ${
      (isFetchingSelectedRevision || !selectedRevision) &&
      !showContentLockedScreen
        ? 'z-index-1 bg-default'
        : '-z-index-1'
    }`}
  >
    {isFetchingSelectedRevision && (
      <div
        className={`sk-spinner w-5 h-5 spinner-info ${ABSOLUTE_CENTER_CLASSNAME}`}
      />
    )}
    {!isFetchingSelectedRevision && !selectedRevision ? (
      <div className={`color-grey-0 select-none ${ABSOLUTE_CENTER_CLASSNAME}`}>
        No revision selected
      </div>
    ) : null}
  </div>
);

export const RevisionHistoryModal: FunctionComponent<RevisionHistoryModalProps> =
  observer(({ application, appState }) => {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const dismissModal = () => {
      appState.notes.setShowRevisionHistoryModal(false);
    };

    const note = Object.values(appState.notes.selectedNotes)[0];
    const editorForCurrentNote = useMemo(() => {
      return application.componentManager.editorForNote(note);
    }, [application.componentManager, note]);

    const [isFetchingSelectedRevision, setIsFetchingSelectedRevision] =
      useState(false);
    const [selectedRevision, setSelectedRevision] = useState<
      HistoryEntry | LegacyHistoryEntry
    >();
    const [selectedRemoteEntry, setSelectedRemoteEntry] =
      useState<RevisionListEntry>();
    const [isDeletingRevision, setIsDeletingRevision] = useState(false);
    const [templateNoteForRevision, setTemplateNoteForRevision] =
      useState<SNNote>();
    const [showContentLockedScreen, setShowContentLockedScreen] =
      useState(false);

    const [remoteHistory, setRemoteHistory] =
      useState<RemoteRevisionListGroup[]>();
    const [isFetchingRemoteHistory, setIsFetchingRemoteHistory] =
      useState(false);

    const fetchRemoteHistory = useCallback(async () => {
      if (note) {
        setRemoteHistory(undefined);
        setIsFetchingRemoteHistory(true);
        try {
          const initialRemoteHistory =
            await application.historyManager.remoteHistoryForItem(note);

          const remoteHistoryAsGroups =
            sortRevisionListIntoGroups<RevisionListEntry>(initialRemoteHistory);

          setRemoteHistory(remoteHistoryAsGroups);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetchingRemoteHistory(false);
        }
      }
    }, [application.historyManager, note]);

    useEffect(() => {
      if (!remoteHistory?.length) {
        fetchRemoteHistory();
      }
    }, [fetchRemoteHistory, remoteHistory?.length]);

    const restore = () => {
      if (selectedRevision) {
        const originalNote = application.findItem(
          selectedRevision.payload.uuid
        ) as SNNote;

        if (originalNote.locked) {
          application.alertService.alert(STRING_RESTORE_LOCKED_ATTEMPT);
          return;
        }

        confirmDialog({
          text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
          confirmButtonStyle: 'danger',
        }).then((confirmed) => {
          if (confirmed) {
            application.mutator.changeAndSaveItem(
              selectedRevision.payload.uuid,
              (mutator) => {
                mutator.unsafe_setCustomContent(
                  selectedRevision.payload.content
                );
              },
              true,
              PayloadSource.RemoteActionRetrieved
            );
            dismissModal();
          }
        });
      }
    };

    const restoreAsCopy = async () => {
      if (selectedRevision) {
        const originalNote = application.findItem(
          selectedRevision.payload.uuid
        ) as SNNote;

        const duplicatedItem = await application.mutator.duplicateItem(
          originalNote,
          {
            ...(selectedRevision.payload.content as PayloadContent),
            title: selectedRevision.payload.content.title
              ? selectedRevision.payload.content.title + ' (copy)'
              : undefined,
          }
        );

        appState.notes.selectNote(duplicatedItem.uuid);

        dismissModal();
      }
    };

    useEffect(() => {
      const fetchTemplateNote = async () => {
        if (selectedRevision) {
          const newTemplateNote = (await application.mutator.createTemplateItem(
            ContentType.Note,
            selectedRevision.payload.content
          )) as SNNote;

          setTemplateNoteForRevision(newTemplateNote);
        }
      };

      fetchTemplateNote();
    }, [application, selectedRevision]);

    const deleteSelectedRevision = () => {
      if (!selectedRemoteEntry) {
        return;
      }

      application.alertService
        .confirm(
          'Are you sure you want to delete this revision?',
          'Delete revision?',
          'Delete revision',
          ButtonType.Danger,
          'Cancel'
        )
        .then((shouldDelete) => {
          if (shouldDelete) {
            setIsDeletingRevision(true);

            application.historyManager
              .deleteRemoteRevision(note.uuid, selectedRemoteEntry)
              .then((res) => {
                if (res.error?.message) {
                  throw new Error(res.error.message);
                }

                fetchRemoteHistory();
                setIsDeletingRevision(false);
              })
              .catch(console.error);
          }
        })
        .catch(console.error);
    };

    return (
      <AlertDialogOverlay
        className={`sn-component ${getPlatformString()}`}
        onDismiss={dismissModal}
        leastDestructiveRef={closeButtonRef}
      >
        <AlertDialogContent
          className="rounded shadow-overlay"
          style={{
            width: '90%',
            maxWidth: '90%',
            minHeight: '90%',
            background: '#fff',
          }}
        >
          <AlertDialogLabel>
            <VisuallyHidden>Note revision history</VisuallyHidden>
          </AlertDialogLabel>
          <AlertDialogDescription
            className={`bg-default flex flex-col h-full overflow-hidden ${
              isDeletingRevision ? 'pointer-events-none cursor-not-allowed' : ''
            }`}
          >
            <div className="flex flex-grow min-h-0">
              <HistoryListContainer
                application={application}
                note={note}
                remoteHistory={remoteHistory}
                isFetchingRemoteHistory={isFetchingRemoteHistory}
                setSelectedRevision={setSelectedRevision}
                setSelectedRemoteEntry={setSelectedRemoteEntry}
                setShowContentLockedScreen={setShowContentLockedScreen}
                setIsFetchingSelectedRevision={setIsFetchingSelectedRevision}
              />
              <div className={`flex flex-col flex-grow relative`}>
                <RevisionContentPlaceholder
                  selectedRevision={selectedRevision}
                  isFetchingSelectedRevision={isFetchingSelectedRevision}
                  showContentLockedScreen={showContentLockedScreen}
                />
                {showContentLockedScreen && !selectedRevision && (
                  <RevisionContentLocked appState={appState} />
                )}
                {selectedRevision && templateNoteForRevision && (
                  <SelectedRevisionContent
                    application={application}
                    appState={appState}
                    selectedRevision={selectedRevision}
                    editorForCurrentNote={editorForCurrentNote}
                    templateNoteForRevision={templateNoteForRevision}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 justify-between items-center min-h-6 px-2.5 py-2 border-0 border-t-1px border-solid border-main">
              <div>
                <Button
                  className="py-1.35"
                  label="Close"
                  onClick={dismissModal}
                  ref={closeButtonRef}
                  type="normal"
                />
              </div>
              {selectedRevision && (
                <div class="flex items-center">
                  {selectedRemoteEntry && (
                    <Button
                      className="py-1.35 mr-2.5"
                      onClick={deleteSelectedRevision}
                      type="normal"
                    >
                      {isDeletingRevision ? (
                        <div className="sk-spinner my-1 w-3 h-3 spinner-info" />
                      ) : (
                        'Delete this revision'
                      )}
                    </Button>
                  )}
                  <Button
                    className="py-1.35 mr-2.5"
                    label="Restore as a copy"
                    onClick={restoreAsCopy}
                    type="normal"
                  />
                  <Button
                    className="py-1.35"
                    label="Restore version"
                    onClick={restore}
                    type="primary"
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialogOverlay>
    );
  });

export const RevisionHistoryModalWrapper: FunctionComponent<RevisionHistoryModalProps> =
  observer(({ application, appState }) => {
    if (!appState.notes.showRevisionHistoryModal) {
      return null;
    }

    return (
      <RevisionHistoryModal application={application} appState={appState} />
    );
  });
