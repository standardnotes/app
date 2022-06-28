import { WebApplication } from '@/Application/Application'
import { ContentType, SNNote } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect, useMemo } from 'react'
import ComponentView from '@/Components/ComponentView/ComponentView'
import { NotesController } from '@/Controllers/NotesController'
import { NoteHistoryController } from '@/Controllers/NoteHistory/NoteHistoryController'

const ABSOLUTE_CENTER_CLASSNAME = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'

type SelectedRevisionContentProps = {
  application: WebApplication
  noteHistoryController: NoteHistoryController
  notesController: NotesController
}

const SelectedRevisionContent: FunctionComponent<SelectedRevisionContentProps> = ({
  application,
  noteHistoryController,
  notesController,
}) => {
  const note = notesController.firstSelectedNote
  const { selectedRevision } = noteHistoryController

  const componentViewer = useMemo(() => {
    const editorForCurrentNote = note ? application.componentManager.editorForNote(note) : undefined

    if (!editorForCurrentNote) {
      return undefined
    }

    const templateNoteForRevision = application.mutator.createTemplateItem(
      ContentType.Note,
      selectedRevision?.payload.content,
    ) as SNNote

    const componentViewer = application.componentManager.createComponentViewer(editorForCurrentNote)
    componentViewer.setReadonly(true)
    componentViewer.lockReadonly = true
    componentViewer.overrideContextItem = templateNoteForRevision
    return componentViewer
  }, [application.componentManager, application.mutator, note, selectedRevision?.payload.content])

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
        <div className="title">{selectedRevision?.payload.content.title}</div>
      </div>
      {!componentViewer && (
        <div className="relative flex-grow min-h-0 overflow-hidden">
          {selectedRevision?.payload.content.text.length ? (
            <textarea
              readOnly={true}
              className="w-full h-full resize-none p-4 pt-0 border-0 bg-default text-text text-editor font-editor"
              value={selectedRevision?.payload.content.text}
            />
          ) : (
            <div className={`text-passive-0 ${ABSOLUTE_CENTER_CLASSNAME}`}>Empty note.</div>
          )}
        </div>
      )}
      {componentViewer && (
        <div className="component-view">
          <ComponentView key={componentViewer.identifier} componentViewer={componentViewer} application={application} />
        </div>
      )}
    </div>
  )
}

export default observer(SelectedRevisionContent)
