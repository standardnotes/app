import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
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
  RevisionListEntry,
  SNNote,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '../Button';
import { ComponentView } from '../ComponentView';
import { NoteTagsContainer } from '../NoteTagsContainer';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const RevisionHistoryModal: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    const onModalDismiss = () => {
      appState.notes.setShowRevisionHistoryModal(false);
    };

    const note = Object.values(appState.notes.selectedNotes)[0];
    const [isFetchingRemoteHistory, setIsFetchingRemoteHistory] =
      useState(false);
    const [remoteHistory, setRemoteHistory] = useState<RevisionListEntry[]>();
    const [selectedEntryUuid, setSelectedEntryUuid] = useState('');
    const [isFetchingSelectedRevision, setIsFetchingSelectedRevision] =
      useState(false);
    const [selectedRevision, setSelectedRevision] = useState<HistoryEntry>();
    const [componentViewer, setComponentViewer] = useState<ComponentViewer>();

    /** @TODO Add loading spinners */
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
            const remoteHistory =
              await application.historyManager.remoteHistoryForItem(note);
            setRemoteHistory(remoteHistory);
            if (remoteHistory?.length) {
              setSelectedEntryUuid(remoteHistory[0].uuid);
              fetchAndSetRemoteRevision(remoteHistory[0]);
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

    const previewRemoteHistoryTitle = (revision: RevisionListEntry) => {
      return new Date(revision.created_at).toLocaleString();
    };

    return (
      <AlertDialogOverlay
        className="sn-component"
        onDismiss={onModalDismiss}
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
          <AlertDialogDescription className="bg-default flex flex-col h-full">
            <div className="flex flex-grow">
              <div
                className={`flex flex-col min-w-68 border-0 border-r-1px border-solid border-main ${
                  isFetchingRemoteHistory ? 'items-center justify-center' : ''
                }`}
              >
                {isFetchingRemoteHistory && (
                  <div className="sk-spinner w-5 h-5 mr-2 spinner-info"></div>
                )}
                {remoteHistory?.map((entry) => (
                  <button
                    key={entry.uuid}
                    className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
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
              </div>
              <div className="flex flex-col flex-grow">
                <div id="editor-title-bar" className="section-title-bar w-full">
                  <div className="title">{note.title}</div>
                  <NoteTagsContainer appState={appState} readOnly={true} />
                </div>
                <div
                  className={
                    isFetchingSelectedRevision
                      ? 'flex flex-grow items-center justify-center'
                      : ''
                  }
                >
                  {isFetchingSelectedRevision ? (
                    <div className="sk-spinner w-5 h-5 mr-2 spinner-info"></div>
                  ) : (
                    <>
                      {!componentViewer && selectedRevision && (
                        <p
                          style="white-space: pre-wrap; font-size: 16px;"
                          className="normal sk-p"
                        >
                          {selectedRevision.payload.content.text}
                        </p>
                      )}
                      {componentViewer && selectedRevision && (
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
                  )}
                </div>
              </div>
            </div>
            <div className="min-h-1px bg-border"></div>
            <div className="flex justify-between items-center px-2.5 py-2">
              <div>
                <Button
                  className="py-1.35"
                  label="Cancel"
                  onClick={onModalDismiss}
                  ref={cancelButtonRef}
                  type="normal"
                />
              </div>
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
                  onClick={() => {
                    /** @TODO */
                  }}
                  type="normal"
                />
                <Button
                  className="py-1.35"
                  label="Restore version"
                  onClick={() => {
                    /** @TODO */
                  }}
                  type="primary"
                />
              </div>
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
