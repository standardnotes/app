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
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Button } from '../Button';
import { HistoryListContainer } from './HistoryListContainer';
import {
  RevisionContentLocked,
  SubscriptionPlanId,
} from './RevisionContentLocked';
import { SelectedRevisionContent } from './SelectedRevisionContent';

type RevisionHistoryModalProps = {
  application: WebApplication;
  appState: AppState;
};

const ABSOLUTE_CENTER_CLASSNAME =
  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

type RevisionContentPlaceholderProps = {
  isFetchingSelectedRevision: boolean;
  selectedRevision: HistoryEntry | undefined;
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
      isFetchingSelectedRevision ||
      (!selectedRevision && !showContentLockedScreen)
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
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry>();
    const [selectedRemoteEntryUuid, setSelectedRemoteEntryUuid] =
      useState<string>();
    const [templateNoteForRevision, setTemplateNoteForRevision] =
      useState<SNNote>();
    const [showContentLockedScreen, setShowContentLockedScreen] =
      useState(false);
    const [userPlanId, setUserPlanId] = useState<SubscriptionPlanId>();

    useEffect(() => {
      const fetchPlanId = async () => {
        const subscription = await application.getUserSubscription();
        const planId = subscription?.planName;
        setUserPlanId(planId);
      };

      fetchPlanId();
    }, [application]);

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
          <AlertDialogDescription className="bg-default flex flex-col h-full overflow-hidden">
            <div className="flex flex-grow min-h-0">
              <HistoryListContainer
                application={application}
                note={note}
                setSelectedRevision={setSelectedRevision}
                setSelectedRemoteEntryUuid={setSelectedRemoteEntryUuid}
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
                  <RevisionContentLocked planId={userPlanId} />
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
                <div>
                  {selectedRemoteEntryUuid && (
                    <Button
                      className="py-1.35 mr-2.5"
                      label="Delete this version"
                      onClick={() => {
                        application.alertService
                          .confirm(
                            'Are you sure you want to delete this version?',
                            'Delete version?',
                            'Delete version',
                            ButtonType.Danger,
                            'Cancel'
                          )
                          .then((shouldDelete) => {
                            if (shouldDelete) {
                              /** @TODO */
                              /** application.historyManager.deleteRemoteRevision(
                               *    note.uuid,
                               *    selectedRemoteEntryUuid
                               *  ) */
                            }
                          })
                          .catch(console.error);
                      }}
                      type="normal"
                    />
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
