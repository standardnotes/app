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
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from '../Button';
import { HistoryListContainer } from './HistoryListContainer';
import { SelectedRevisionContent } from './SelectedRevisionContent';

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

    const [isFetchingSelectedRevision, setIsFetchingSelectedRevision] =
      useState(false);
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry>();
    const [templateNoteForRevision, setTemplateNoteForRevision] =
      useState<SNNote>();

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
              <HistoryListContainer
                application={application}
                note={note}
                setSelectedRevision={setSelectedRevision}
                setIsFetchingSelectedRevision={setIsFetchingSelectedRevision}
              />
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
