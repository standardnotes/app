import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { HistoryEntry, SNComponent, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect, useMemo } from 'react'
import ComponentView from '@/Components/ComponentView/ComponentView'
import { LegacyHistoryEntry } from './utils'

const ABSOLUTE_CENTER_CLASSNAME = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'

type SelectedRevisionContentProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  selectedRevision: HistoryEntry | LegacyHistoryEntry
  editorForCurrentNote: SNComponent | undefined
  templateNoteForRevision: SNNote
}

const SelectedRevisionContent: FunctionComponent<SelectedRevisionContentProps> = ({
  application,
  viewControllerManager,
  selectedRevision,
  editorForCurrentNote,
  templateNoteForRevision,
}) => {
  const componentViewer = useMemo(() => {
    if (!editorForCurrentNote) {
      return undefined
    }

    const componentViewer = application.componentManager.createComponentViewer(editorForCurrentNote)
    componentViewer.setReadonly(true)
    componentViewer.lockReadonly = true
    componentViewer.overrideContextItem = templateNoteForRevision
    return componentViewer
  }, [application, editorForCurrentNote, templateNoteForRevision])

  useEffect(() => {
    return () => {
      if (componentViewer) {
        application.componentManager.destroyComponentViewer(componentViewer)
      }
    }
  }, [application, componentViewer])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 text-base font-bold w-full">
        <div className="title">{selectedRevision.payload.content.title}</div>
      </div>
      {!componentViewer && (
        <div className="relative flex-grow min-h-0 overflow-hidden">
          {selectedRevision.payload.content.text.length ? (
            <textarea
              readOnly={true}
              className="w-full h-full resize-none p-4 pt-0 border-0 bg-default color-text text-editor font-editor"
              defaultValue={selectedRevision.payload.content.text}
            />
          ) : (
            <div className={`color-passive-0 ${ABSOLUTE_CENTER_CLASSNAME}`}>Empty note.</div>
          )}
        </div>
      )}
      {componentViewer && (
        <div className="component-view">
          <ComponentView
            key={componentViewer.identifier}
            componentViewer={componentViewer}
            application={application}
            viewControllerManager={viewControllerManager}
          />
        </div>
      )}
    </div>
  )
}

export default observer(SelectedRevisionContent)
