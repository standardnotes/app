import { confirmDialog } from '@/services/alertService';
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { getPlatformString } from '@/utils';
import { DAYS_IN_A_WEEK, DAYS_IN_A_YEAR } from '@/views/constants';
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogLabel,
  AlertDialogOverlay,
} from '@reach/alert-dialog';
import VisuallyHidden from '@reach/visually-hidden';
import {
  ComponentViewer,
  ContentType,
  HistoryEntry,
  PayloadContent,
  PayloadSource,
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { Fragment, FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '../Button';
import { ComponentView } from '../ComponentView';
import { NoteTagsContainer } from '../NoteTagsContainer';
import { calculateDifferenceBetweenDatesInDays } from '../utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

type RevisionListGroup = {
  title: string;
  entries: RevisionListEntry[] | undefined;
};

const GROUP_TITLE_TODAY = 'Today';
const GROUP_TITLE_WEEK = 'This Week';
const GROUP_TITLE_YEAR = 'More Than A Year Ago';

const sortRevisionListIntoGroups = (
  revisionList: RevisionListEntry[] | undefined
) => {
  const initialGroups: RevisionListGroup[] = [
    {
      title: GROUP_TITLE_TODAY,
      entries: [],
    },
    {
      title: GROUP_TITLE_WEEK,
      entries: [],
    },
    {
      title: GROUP_TITLE_YEAR,
      entries: [],
    },
  ];

  revisionList?.forEach((entry) => {
    const todayAsDate = new Date();
    const entryDate = new Date(entry.created_at);

    const differenceBetweenDatesInDays = calculateDifferenceBetweenDatesInDays(
      todayAsDate,
      entryDate
    );

    if (differenceBetweenDatesInDays === 0) {
      const todayGroupIndex = initialGroups.findIndex(
        (group) => group.title === GROUP_TITLE_TODAY
      );
      initialGroups[todayGroupIndex]?.entries?.push(entry);
      return;
    }

    if (
      differenceBetweenDatesInDays > 0 &&
      differenceBetweenDatesInDays < DAYS_IN_A_WEEK
    ) {
      const weekGroupIndex = initialGroups.findIndex(
        (group) => group.title === GROUP_TITLE_WEEK
      );
      initialGroups[weekGroupIndex]?.entries?.push(entry);
      return;
    }

    if (differenceBetweenDatesInDays > DAYS_IN_A_YEAR) {
      const yearGroupIndex = initialGroups.findIndex(
        (group) => group.title === GROUP_TITLE_YEAR
      );
      initialGroups[yearGroupIndex]?.entries?.push(entry);
      return;
    }

    const formattedEntryMonthYear = entryDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

    const monthGroupIndex = initialGroups.findIndex(
      (group) => group.title === formattedEntryMonthYear
    );

    if (monthGroupIndex > -1) {
      initialGroups[monthGroupIndex]?.entries?.push(entry);
    } else {
      initialGroups.push({
        title: formattedEntryMonthYear,
        entries: [entry],
      });
    }
  });

  return initialGroups;
};

export const RevisionHistoryModal: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    const dismissModal = () => {
      appState.notes.setShowRevisionHistoryModal(false);
    };

    const note = Object.values(appState.notes.selectedNotes)[0];
    const [isFetchingRemoteHistory, setIsFetchingRemoteHistory] =
      useState(false);
    const [remoteHistory, setRemoteHistory] = useState<RevisionListGroup[]>();
    const [selectedEntryUuid, setSelectedEntryUuid] = useState('');
    const [isFetchingSelectedRevision, setIsFetchingSelectedRevision] =
      useState(false);
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry>();
    const [componentViewer, setComponentViewer] = useState<ComponentViewer>();

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
              sortRevisionListIntoGroups(initialRemoteHistory);

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

    useEffect(() => {
      const initializeComponentViewer = async () => {
        if (selectedRevision) {
          const templateNote = (await application.createTemplateItem(
            ContentType.Note,
            selectedRevision.payload.content
          )) as SNNote;

          const originalNote = application.findItem(
            selectedRevision.payload.uuid
          ) as SNNote;

          const component =
            application.componentManager.editorForNote(originalNote);
          if (component) {
            const componentViewer =
              application.componentManager.createComponentViewer(component);
            componentViewer.setReadonly(true);
            componentViewer.lockReadonly = true;
            componentViewer.overrideContextItem = templateNote;
            setComponentViewer(componentViewer);
          } else if (componentViewer) {
            application.componentManager.destroyComponentViewer(
              componentViewer
            );
            setComponentViewer(undefined);
          }
        }
      };

      initializeComponentViewer();

      return () => {
        if (componentViewer) {
          application.componentManager.destroyComponentViewer(componentViewer);
        }
      };
    }, [application, componentViewer, selectedRevision]);

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

    const previewRemoteHistoryTitle = (revision: RevisionListEntry) => {
      return new Date(revision.created_at).toLocaleString();
    };

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
                className={`flex flex-col min-w-60 py-1 border-0 border-r-1px border-solid border-main overflow-auto ${
                  isFetchingRemoteHistory ? 'items-center justify-center' : ''
                }`}
              >
                {isFetchingRemoteHistory && (
                  <div className="sk-spinner w-5 h-5 mr-2 spinner-info"></div>
                )}
                {remoteHistory?.map((group) =>
                  group.entries && group.entries.length ? (
                    <Fragment key={group.title}>
                      <div className="px-3 my-1 font-semibold color-text uppercase">
                        {group.title}
                      </div>
                      {group.entries.map((entry) => (
                        <button
                          key={entry.uuid}
                          className="sn-dropdown-item py-2 focus:bg-info-backdrop focus:shadow-none"
                          onClick={() => {
                            setSelectedEntryUuid(entry.uuid);
                            fetchAndSetRemoteRevision(entry);
                          }}
                        >
                          <div
                            className={`pseudo-radio-btn ${
                              selectedEntryUuid === entry.uuid
                                ? 'pseudo-radio-btn--checked'
                                : ''
                            } mr-2`}
                          ></div>
                          {previewRemoteHistoryTitle(entry)}
                        </button>
                      ))}
                    </Fragment>
                  ) : null
                )}
              </div>
              <div
                className={`flex flex-col flex-grow ${
                  isFetchingSelectedRevision
                    ? 'items-center justify-center'
                    : ''
                }`}
              >
                {isFetchingSelectedRevision ? (
                  <div className="sk-spinner w-5 h-5 mr-2 spinner-info"></div>
                ) : (
                  selectedRevision && (
                    <>
                      <div className="p-4 pb-0 text-base font-bold w-full">
                        <div className="title">
                          {selectedRevision.payload.content.title}
                        </div>
                        <NoteTagsContainer
                          appState={appState}
                          readOnly={true}
                        />
                      </div>
                      {!componentViewer && (
                        <p className="p-4">
                          {selectedRevision.payload.content.text}
                        </p>
                      )}
                      {componentViewer && (
                        <>
                          <div className="component-view">
                            <ComponentView
                              componentViewer={componentViewer}
                              application={application}
                              appState={appState}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )
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
