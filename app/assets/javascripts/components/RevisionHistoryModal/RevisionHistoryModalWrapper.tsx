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
import { RemoteHistoryList } from './RemoteHistoryList';
import { SelectedRevisionContent } from './SelectedRevisionContent';
import { RemoteRevisionListGroup, sortRevisionListIntoGroups } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const RevisionHistoryModal: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    const dismissModal = () => {
      appState.notes.setShowRevisionHistoryModal(false);
    };

    const note = Object.values(appState.notes.selectedNotes)[0];
    const editorForCurrentNote = useMemo(() => {
      return application.componentManager.editorForNote(note);
    }, [application.componentManager, note]);

    const [isFetchingRemoteHistory, setIsFetchingRemoteHistory] =
      useState(false);
    const [remoteHistory, setRemoteHistory] =
      useState<RemoteRevisionListGroup[]>();

    const [selectedEntryUuid, setSelectedEntryUuid] = useState('');

    const [isFetchingSelectedRevision, setIsFetchingSelectedRevision] =
      useState(false);
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry>();
    const [templateNoteForRevision, setTemplateNoteForRevision] =
      useState<SNNote>();

    const fetchAndSetRemoteRevision = useCallback(
      async (revisionListEntry: RevisionListEntry) => {
        setIsFetchingSelectedRevision(true);
        try {
          const remoteRevision =
            await application.historyManager.fetchRemoteRevision(
              note.uuid,
              revisionListEntry
            );
          setSelectedRevision(remoteRevision);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetchingSelectedRevision(false);
        }
      },
      [application.historyManager, note.uuid]
    );

    useEffect(() => {
      const fetchRemoteHistory = async () => {
        if (note) {
          setIsFetchingRemoteHistory(true);
          try {
            const initialRemoteHistory =
              await application.historyManager.remoteHistoryForItem(note);

            const remoteHistoryAsGroups =
              sortRevisionListIntoGroups<RevisionListEntry>(
                initialRemoteHistory
              );

            setRemoteHistory(remoteHistoryAsGroups);

            if (initialRemoteHistory?.length) {
              setSelectedEntryUuid(initialRemoteHistory[0].uuid);
              fetchAndSetRemoteRevision(initialRemoteHistory[0]);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsFetchingRemoteHistory(false);
          }
        }
      };

      fetchRemoteHistory();
    }, [application.historyManager, fetchAndSetRemoteRevision, note]);

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
            application.changeAndSaveItem(
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

        await application.duplicateItem(originalNote, {
          ...(selectedRevision.payload.content as PayloadContent),
          title: selectedRevision.payload.content.title
            ? selectedRevision.payload.content.title + ' (copy)'
            : undefined,
        });

        dismissModal();
      }
    };

    useEffect(() => {
      const fetchTemplateNote = async () => {
        if (selectedRevision) {
          const newTemplateNote = (await application.createTemplateItem(
            ContentType.Note,
            selectedRevision.payload.content
          )) as SNNote;

          setTemplateNoteForRevision(newTemplateNote);
        }
      };

      fetchTemplateNote();
    }, [application, selectedRevision]);

    return (
      <AlertDialogOverlay
        className={`sn-component ${getPlatformString()}`}
        onDismiss={dismissModal}
        leastDestructiveRef={cancelButtonRef}
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
          <AlertDialogDescription className="bg-default flex flex-col h-full overflow-hidden">
            <div className="flex flex-grow min-h-0">
              <div
                className={`flex flex-col min-w-60 py-1 border-0 border-r-1px border-solid border-main overflow-auto`}
              >
                <RemoteHistoryList
                  remoteHistory={remoteHistory}
                  isFetchingRemoteHistory={isFetchingRemoteHistory}
                  fetchAndSetRemoteRevision={fetchAndSetRemoteRevision}
                  selectedEntryUuid={selectedEntryUuid}
                  setSelectedEntryUuid={setSelectedEntryUuid}
                />
              </div>
              <div className={`flex-grow relative`}>
                {selectedRevision && templateNoteForRevision && (
                  <SelectedRevisionContent
                    application={application}
                    appState={appState}
                    isFetchingSelectedRevision={isFetchingSelectedRevision}
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
                  label="Cancel"
                  onClick={dismissModal}
                  ref={cancelButtonRef}
                  type="normal"
                />
              </div>
              {selectedRevision && (
                <div>
                  <Button
                    className="py-1.35 mr-2.5"
                    label="Delete this version"
                    onClick={() => {
                      /** @TODO */
                    }}
                    type="normal"
                  />
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
  }
);

export const RevisionHistoryModalWrapper: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    if (!appState.notes.showRevisionHistoryModal) {
      return null;
    }

    return (
      <RevisionHistoryModal application={application} appState={appState} />
    );
  }
);
