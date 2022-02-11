import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { HistoryEntry, SNComponent, SNNote } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { ComponentView } from '../ComponentView';
import { LegacyHistoryEntry } from './utils';

const ABSOLUTE_CENTER_CLASSNAME =
  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

type SelectedRevisionContentProps = {
  application: WebApplication;
  appState: AppState;
  selectedRevision: HistoryEntry | LegacyHistoryEntry;
  editorForCurrentNote: SNComponent | undefined;
  templateNoteForRevision: SNNote;
};

export const SelectedRevisionContent: FunctionComponent<SelectedRevisionContentProps> =
  observer(
    ({
      application,
      appState,
      selectedRevision,
      editorForCurrentNote,
      templateNoteForRevision,
    }) => {
      const componentViewer = useMemo(() => {
        if (editorForCurrentNote) {
          const componentViewer =
            application.componentManager.createComponentViewer(
              editorForCurrentNote
            );
          componentViewer.setReadonly(true);
          componentViewer.lockReadonly = true;
          componentViewer.overrideContextItem = templateNoteForRevision;
          return componentViewer;
        } else {
          return undefined;
        }
      }, [
        application.componentManager,
        editorForCurrentNote,
        templateNoteForRevision,
      ]);

      useEffect(() => {
        return () => {
          if (componentViewer) {
            application.componentManager.destroyComponentViewer(
              componentViewer
            );
          }
        };
      }, [application.componentManager, componentViewer]);

      return (
        <div className="flex flex-col h-full">
          <div className="p-4 text-base font-bold w-full">
            <div className="title">
              {selectedRevision.payload.content.title}
            </div>
          </div>
          {!componentViewer && (
            <div className="relative flex-grow">
              {selectedRevision.payload.content.text.length ? (
                <p className="p-4 pt-0">
                  {selectedRevision.payload.content.text}
                </p>
              ) : (
                <div className={ABSOLUTE_CENTER_CLASSNAME}>Empty note.</div>
              )}
            </div>
          )}
          {componentViewer && (
            <div className="component-view">
              <ComponentView
                key={componentViewer.identifier}
                componentViewer={componentViewer}
                application={application}
                appState={appState}
              />
            </div>
          )}
        </div>
      );
    }
  );
