import { WebApplication } from '@/Application/WebApplication'
import {
  ApplicationEvent,
  classNames,
  EditorFontSize,
  EditorLineHeight,
  isPayloadSourceRetrieved,
  PrefKey,
  PrefDefaults,
  NativeFeatureIdentifier,
  FeatureStatus,
  GetSuperNoteFeature,
  EditorLineHeightValues,
} from '@standardnotes/snjs'
import { CSSProperties, FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { BlocksEditor } from './BlocksEditor'
import { BlocksEditorComposer } from './BlocksEditorComposer'
import { ItemSelectionPlugin } from './Plugins/ItemSelectionPlugin/ItemSelectionPlugin'
import { FileNode } from './Plugins/EncryptedFilePlugin/Nodes/FileNode'
import FilePlugin from './Plugins/EncryptedFilePlugin/FilePlugin'
import BlockPickerMenuPlugin from './Plugins/BlockPickerPlugin/BlockPickerPlugin'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { LinkingController } from '@/Controllers/LinkingController'
import LinkingControllerProvider from '../../Controllers/LinkingControllerProvider'
import { BubbleNode } from './Plugins/ItemBubblePlugin/Nodes/BubbleNode'
import ItemBubblePlugin from './Plugins/ItemBubblePlugin/ItemBubblePlugin'
import { NodeObserverPlugin } from './Plugins/NodeObserverPlugin/NodeObserverPlugin'
import { FilesController } from '@/Controllers/FilesController'
import FilesControllerProvider from '@/Controllers/FilesControllerProvider'
import DatetimePlugin from './Plugins/DateTimePlugin/DateTimePlugin'
import AutoLinkPlugin from './Plugins/AutoLinkPlugin/AutoLinkPlugin'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import {
  ChangeContentCallbackPlugin,
  ChangeEditorFunction,
} from './Plugins/ChangeContentCallback/ChangeContentCallback'
import PasswordPlugin from './Plugins/PasswordPlugin/PasswordPlugin'
import { useCommandService } from '@/Components/CommandProvider'
import { SUPER_SHOW_MARKDOWN_PREVIEW } from '@standardnotes/ui-services'
import { SuperNoteMarkdownPreview } from './SuperNoteMarkdownPreview'
import GetMarkdownPlugin, { GetMarkdownPluginInterface } from './Plugins/GetMarkdownPlugin/GetMarkdownPlugin'
import { useResponsiveEditorFontSize } from '@/Utils/getPlaintextFontSize'
import ReadonlyPlugin from './Plugins/ReadonlyPlugin/ReadonlyPlugin'
import { SuperSearchContextProvider } from './Plugins/SearchPlugin/Context'
import { SearchPlugin } from './Plugins/SearchPlugin/SearchPlugin'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import CodeOptionsPlugin from './Plugins/CodeOptionsPlugin/CodeOptions'
import RemoteImagePlugin from './Plugins/RemoteImagePlugin/RemoteImagePlugin'
import NotEntitledBanner from '../ComponentView/NotEntitledBanner'
import AutoFocusPlugin from './Plugins/AutoFocusPlugin'

export const SuperNotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  controller: NoteViewController
  linkingController: LinkingController
  filesController: FilesController
  spellcheck: boolean
  readonly?: boolean
}

export const SuperEditor: FunctionComponent<Props> = ({
  application,
  linkingController,
  filesController,
  spellcheck,
  controller,
  readonly,
}) => {
  const note = useRef(controller.item)
  const changeEditorFunction = useRef<ChangeEditorFunction>()
  const ignoreNextChange = useRef(false)
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false)
  const getMarkdownPlugin = useRef<GetMarkdownPluginInterface | null>(null)
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>(FeatureStatus.Entitled)

  useEffect(() => {
    setFeatureStatus(
      application.features.getFeatureStatus(
        NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.SuperEditor).getValue(),
        {
          inContextOfItem: note.current,
        },
      ),
    )
  }, [application.features])

  const commandService = useCommandService()

  useEffect(() => {
    return commandService.addCommandHandler({
      command: SUPER_SHOW_MARKDOWN_PREVIEW,
      onKeyDown: () => setShowMarkdownPreview(true),
    })
  }, [commandService])

  const closeMarkdownPreview = useCallback(() => {
    setShowMarkdownPreview(false)
  }, [])

  useEffect(() => {
    return application.actions.addPayloadRequestHandler((uuid) => {
      if (uuid === note.current.uuid) {
        const basePayload = note.current.payload.ejected()
        return {
          ...basePayload,
          content: {
            ...basePayload.content,
            text: getMarkdownPlugin.current?.getMarkdown() ?? basePayload.content.text,
          },
        }
      }
    })
  }, [application])

  const handleChange = useCallback(
    async (value: string, preview: string) => {
      if (ignoreNextChange.current === true) {
        ignoreNextChange.current = false
        return
      }

      void controller.saveAndAwaitLocalPropagation({
        text: value,
        isUserModified: true,
        previews: {
          previewPlain: preview,
          previewHtml: undefined,
        },
      })
    },
    [controller],
  )

  const handleBubbleRemove = useCallback(
    (itemUuid: string) => {
      const item = application.items.findItem(itemUuid)
      if (item) {
        linkingController.unlinkItemFromSelectedItem(item).catch(console.error)
      }
    },
    [linkingController, application],
  )

  useEffect(() => {
    const disposer = controller.addNoteInnerValueChangeObserver((updatedNote, source) => {
      if (updatedNote.uuid !== note.current.uuid) {
        throw Error('Editor received changes for non-current note')
      }

      if (isPayloadSourceRetrieved(source)) {
        ignoreNextChange.current = true
        changeEditorFunction.current?.(updatedNote.text)
      }

      note.current = updatedNote
    })

    return disposer
  }, [controller, controller.item.uuid])

  const [lineHeight, setLineHeight] = useState<EditorLineHeight>(() =>
    application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight]),
  )
  const [fontSize, setFontSize] = useState<EditorFontSize>(() =>
    application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize]),
  )
  const responsiveFontSize = useResponsiveEditorFontSize(fontSize, false)

  const reloadPreferences = useCallback(() => {
    const lineHeight = application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight])
    const fontSize = application.getPreference(PrefKey.EditorFontSize, PrefDefaults[PrefKey.EditorFontSize])

    setLineHeight(lineHeight)
    setFontSize(fontSize)
  }, [application])

  useEffect(() => {
    reloadPreferences()

    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      reloadPreferences()
    })
  }, [reloadPreferences, application])

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const invalidURLClickFix = (event: MouseEvent) => {
      if ((event.target as HTMLElement).tagName !== 'A') {
        return
      }
      const isAbsoluteLink = (event.target as HTMLAnchorElement).getAttribute('href')?.startsWith('http')
      if (!isAbsoluteLink) {
        event.preventDefault()
      }
    }

    const element = ref.current

    if (element) {
      element.addEventListener('click', invalidURLClickFix)
    }

    return () => {
      if (element) {
        element.removeEventListener('click', invalidURLClickFix)
      }
    }
  }, [])

  return (
    <div
      className="font-editor relative flex h-full w-full flex-col"
      style={
        {
          '--line-height': EditorLineHeightValues[lineHeight],
          '--font-size': responsiveFontSize,
        } as CSSProperties
      }
      ref={ref}
    >
      {featureStatus !== FeatureStatus.Entitled && (
        <NotEntitledBanner featureStatus={featureStatus} feature={GetSuperNoteFeature()} />
      )}
      <ErrorBoundary>
        <LinkingControllerProvider controller={linkingController}>
          <FilesControllerProvider controller={filesController}>
            <BlocksEditorComposer readonly={note.current.locked || readonly} initialValue={note.current.text}>
              <BlocksEditor
                onChange={handleChange}
                className={classNames(
                  'blocks-editor relative h-full resize-none px-4 py-4 text-[length:--font-size] focus:shadow-none focus:outline-none',
                  lineHeight && 'leading-[--line-height]',
                )}
                previewLength={SuperNotePreviewCharLimit}
                spellcheck={spellcheck}
                readonly={note.current.locked || readonly}
              >
                <ItemSelectionPlugin currentNote={note.current} />
                <FilePlugin currentNote={note.current} />
                <ItemBubblePlugin />
                <BlockPickerMenuPlugin />
                <GetMarkdownPlugin ref={getMarkdownPlugin} />
                <DatetimePlugin />
                <PasswordPlugin />
                <AutoLinkPlugin />
                <ChangeContentCallbackPlugin
                  providerCallback={(callback) => (changeEditorFunction.current = callback)}
                />
                <NodeObserverPlugin nodeType={BubbleNode} onRemove={handleBubbleRemove} />
                <NodeObserverPlugin nodeType={FileNode} onRemove={handleBubbleRemove} />
                {readonly === undefined && <ReadonlyPlugin note={note.current} />}
                <AutoFocusPlugin isEnabled={controller.isTemplateNote} />
                <SuperSearchContextProvider>
                  <SearchPlugin />
                </SuperSearchContextProvider>
                <CodeOptionsPlugin />
                <RemoteImagePlugin />
              </BlocksEditor>
            </BlocksEditorComposer>
          </FilesControllerProvider>
        </LinkingControllerProvider>
        <ModalOverlay isOpen={showMarkdownPreview} close={closeMarkdownPreview}>
          <SuperNoteMarkdownPreview note={note.current} closeDialog={closeMarkdownPreview} />
        </ModalOverlay>
      </ErrorBoundary>
    </div>
  )
}
