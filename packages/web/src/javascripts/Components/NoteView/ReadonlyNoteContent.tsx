import {
  ContentType,
  EditorLineHeightValues,
  NoteContent,
  NoteType,
  PrefKey,
  SNNote,
  classNames,
  isUIFeatureAnIframeFeature,
} from '@standardnotes/snjs'
import { CSSProperties, UIEventHandler, useEffect, useMemo, useRef } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../ApplicationProvider'
import IframeFeatureView from '../ComponentView/IframeFeatureView'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { BlocksEditor } from '../SuperEditor/BlocksEditor'
import { BlocksEditorComposer } from '../SuperEditor/BlocksEditorComposer'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import usePreference from '@/Hooks/usePreference'
import { useResponsiveEditorFontSize } from '@/Utils/getPlaintextFontSize'

export const ReadonlyNoteContent = ({
  note,
  content,
  showLinkedItems = true,
  scrollPos,
  shouldSyncScroll,
  onScroll,
}: {
  note: SNNote
  content: NoteContent
  showLinkedItems?: boolean
  scrollPos?: number
  shouldSyncScroll?: boolean
  onScroll?: UIEventHandler
}) => {
  const application = useApplication()
  const linkingController = useLinkingController()

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const componentViewer = useMemo(() => {
    const editorForCurrentNote = application.componentManager.editorForNote(note)
    if (!isUIFeatureAnIframeFeature(editorForCurrentNote)) {
      return undefined
    }

    const templateNoteForRevision = application.items.createTemplateItem(ContentType.TYPES.Note, content) as SNNote

    const componentViewer = application.componentManager.createComponentViewer(editorForCurrentNote, {
      readonlyItem: templateNoteForRevision,
    })

    return componentViewer
  }, [application.componentManager, application.items, content, note])

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

  const lineHeight = usePreference(PrefKey.EditorLineHeight)
  const fontSize = usePreference(PrefKey.EditorFontSize)
  const responsiveFontSize = useResponsiveEditorFontSize(fontSize, false)

  return (
    <div className="flex h-full flex-grow flex-col overflow-hidden" ref={containerRef}>
      <div className={classNames('w-full px-4 pt-4 text-base font-bold', componentViewer && 'pb-4')}>
        <div className="title">{content.title}</div>
      </div>
      {showLinkedItems && (
        <LinkedItemBubblesContainer
          item={note}
          linkingController={linkingController}
          readonly
          className={{ base: 'mt-2 px-4', withToggle: '!mt-1 !pt-0' }}
          isCollapsedByDefault={isMobileScreen}
        />
      )}
      {componentViewer ? (
        <div className="component-view">
          <IframeFeatureView key={componentViewer.identifier} componentViewer={componentViewer} />
        </div>
      ) : content.noteType === NoteType.Super ? (
        <ErrorBoundary>
          <div
            className="w-full flex-grow overflow-hidden overflow-y-auto"
            style={
              {
                '--line-height': EditorLineHeightValues[lineHeight],
                '--font-size': responsiveFontSize,
              } as CSSProperties
            }
          >
            <BlocksEditorComposer readonly initialValue={content.text} key={content.text}>
              <BlocksEditor
                readonly
                className="blocks-editor relative h-full resize-none p-4 text-base focus:shadow-none focus:outline-none"
                spellcheck={content.spellcheck}
                onScroll={onScroll}
              ></BlocksEditor>
            </BlocksEditorComposer>
          </div>
        </ErrorBoundary>
      ) : (
        <div className="relative mt-3 min-h-0 flex-grow overflow-hidden">
          {content.text.length ? (
            <textarea
              readOnly={true}
              className="font-editor h-full w-full resize-none border-0 bg-default p-4 pt-0 text-editor text-text"
              value={content.text}
              onScroll={onScroll}
            />
          ) : (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-passive-0">
              Empty note.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
