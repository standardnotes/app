import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { ComponentViewer, HistoryEntry } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { ComponentView } from '../ComponentView';
import { NoteTagsContainer } from '../NoteTagsContainer';

const ABSOLUTE_CENTER_CLASSNAME =
  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

type SelectedRevisionContentProps = {
  application: WebApplication;
  appState: AppState;
  isFetchingSelectedRevision: boolean;
  selectedRevision: HistoryEntry | undefined;
  componentViewer: ComponentViewer | undefined;
};

export const SelectedRevisionContent: FunctionComponent<SelectedRevisionContentProps> =
  observer(
    ({
      application,
      appState,
      isFetchingSelectedRevision,
      selectedRevision,
      componentViewer,
    }) => {
      if (!isFetchingSelectedRevision && !selectedRevision) {
        return (
          <div className={ABSOLUTE_CENTER_CLASSNAME}>No revision selected.</div>
        );
      }

      if (isFetchingSelectedRevision) {
        return (
          <div
            className={`sk-spinner w-5 h-5 mr-2 spinner-info ${ABSOLUTE_CENTER_CLASSNAME}`}
          ></div>
        );
      }

      if (selectedRevision) {
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 pb-0 text-base font-bold w-full">
              <div className="title">
                {selectedRevision.payload.content.title}
              </div>
              <NoteTagsContainer appState={appState} readOnly={true} />
            </div>
            {!componentViewer && (
              <div className="relative flex-grow">
                {selectedRevision.payload.content.text.length ? (
                  <p className="p-4">{selectedRevision.payload.content.text}</p>
                ) : (
                  <div className={ABSOLUTE_CENTER_CLASSNAME}>Empty note.</div>
                )}
              </div>
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
          </div>
        );
      }

      return null;
    }
  );
