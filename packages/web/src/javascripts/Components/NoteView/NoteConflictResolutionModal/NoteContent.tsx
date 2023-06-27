import { ContentType, NoteType, SNNote } from '@standardnotes/snjs'
import { UIEventHandler, useEffect, useMemo, useRef } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../../ApplicationProvider'
import ComponentView from '../../ComponentView/ComponentView'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { BlocksEditor } from '../../SuperEditor/BlocksEditor'
import { BlocksEditorComposer } from '../../SuperEditor/BlocksEditorComposer'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import LinkedItemBubblesContainer from '../../LinkedItems/LinkedItemBubblesContainer'

export const NoteContent = ({
  note,
  scrollPos,
  shouldSyncScroll,
  onScroll,
}: {
  note: SNNote
  scrollPos: number
  shouldSyncScroll: boolean
  onScroll: UIEventHandler
}) => {
  const application = useApplication()
  const linkingController = useLinkingController()

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const componentViewer = useMemo(() => {
    const editorForCurrentNote = note ? application.componentManager.editorForNote(note) : undefined

    if (!editorForCurrentNote) {
      return undefined
    }

    const templateNoteForRevision = application.items.createTemplateItem(ContentType.Note, note.content) as SNNote

    const componentViewer = application.componentManager.createComponentViewer(editorForCurrentNote)
    componentViewer.setReadonly(true)
    componentViewer.lockReadonly = true
    componentViewer.overrideContextItem = templateNoteForRevision
    return componentViewer
  }, [application.componentManager, application.mutator, note])

  useEffect(() => {
    return () => {
      if (componentViewer) {
        application.componentManager.destroyComponentViewer(componentViewer)
      }
    }
  }, [application, componentViewer])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shouldSyncScroll) {
      return
    }

    if (!containerRef.current) {
      return
    }

    const scroller = containerRef.current.querySelector('textarea, .ContentEditable__root')

    if (!scroller) {
      return
    }

    scroller.scrollTo({
      top: scrollPos,
    })
  }, [scrollPos, shouldSyncScroll])

  return (
    <div className="flex h-full flex-grow flex-col overflow-hidden" ref={containerRef}>
      <div className="w-full px-4 pt-4 text-base font-bold">
        <div className="title">{note.title}</div>
      </div>
      <LinkedItemBubblesContainer
        item={note}
        linkingController={linkingController}
        readonly
        className={{ base: 'mt-2 px-4', withToggle: '!mt-1 !pt-0' }}
        isCollapsedByDefault={isMobileScreen}
      />
      {componentViewer ? (
        <div className="component-view">
          <ComponentView key={componentViewer.identifier} componentViewer={componentViewer} application={application} />
        </div>
      ) : note?.noteType === NoteType.Super ? (
        <ErrorBoundary>
          <div className="w-full flex-grow overflow-hidden overflow-y-auto">
            <BlocksEditorComposer readonly initialValue={note.text}>
              <BlocksEditor
                readonly
                className="blocks-editor relative h-full resize-none p-4 text-base focus:shadow-none focus:outline-none"
                spellcheck={note.spellcheck}
                onScroll={onScroll}
              ></BlocksEditor>
            </BlocksEditorComposer>
          </div>
        </ErrorBoundary>
      ) : (
        <div className="relative mt-3 min-h-0 flex-grow overflow-hidden">
          {note.text.length ? (
            <textarea
              readOnly={true}
              className="font-editor h-full w-full resize-none border-0 bg-default p-4 pt-0 text-editor text-text"
              value={note.text}
              onScroll={onScroll}
            />
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-passive-0">
              Empty note.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
