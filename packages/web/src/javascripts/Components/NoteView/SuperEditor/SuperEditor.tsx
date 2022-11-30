import { WebApplication } from '@/Application/Application'
import { ApplicationEvent, EditorLineHeight, isPayloadSourceRetrieved, PrefKey } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { BlocksEditor, BlocksEditorComposer } from '@standardnotes/blocks-editor'
import { ItemSelectionPlugin } from './Plugins/ItemSelectionPlugin/ItemSelectionPlugin'
import { FileNode } from './Plugins/EncryptedFilePlugin/Nodes/FileNode'
import FilePlugin from './Plugins/EncryptedFilePlugin/FilePlugin'
import BlockPickerMenuPlugin from './Plugins/BlockPickerPlugin/BlockPickerPlugin'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import { LinkingController } from '@/Controllers/LinkingController'
import LinkingControllerProvider from '../../../Controllers/LinkingControllerProvider'
import { BubbleNode } from './Plugins/ItemBubblePlugin/Nodes/BubbleNode'
import ItemBubblePlugin from './Plugins/ItemBubblePlugin/ItemBubblePlugin'
import { NodeObserverPlugin } from './Plugins/NodeObserverPlugin/NodeObserverPlugin'
import { FilesController } from '@/Controllers/FilesController'
import FilesControllerProvider from '@/Controllers/FilesControllerProvider'
import DatetimePlugin from './Plugins/DateTimePlugin/DateTimePlugin'
import AutoLinkPlugin from './Plugins/AutoLinkPlugin/AutoLinkPlugin'
import { NoteViewController } from '../Controller/NoteViewController'
import {
  ChangeContentCallbackPlugin,
  ChangeEditorFunction,
} from './Plugins/ChangeContentCallback/ChangeContentCallback'
import PasswordPlugin from './Plugins/PasswordPlugin/PasswordPlugin'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { useCommandService } from '@/Components/CommandProvider'
import { SUPER_SHOW_MARKDOWN_PREVIEW } from '@standardnotes/ui-services'
import { SuperNoteMarkdownPreview } from './SuperNoteMarkdownPreview'
import { ExportPlugin } from './Plugins/ExportPlugin/ExportPlugin'
import GetMarkdownPlugin, { GetMarkdownPluginInterface } from './Plugins/GetMarkdownPlugin/GetMarkdownPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'

const NotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  controller: NoteViewController
  linkingController: LinkingController
  filesController: FilesController
  spellcheck: boolean
}

export const SuperEditor: FunctionComponent<Props> = ({
  application,
  linkingController,
  filesController,
  spellcheck,
  controller,
}) => {
  const note = useRef(controller.item)
  const changeEditorFunction = useRef<ChangeEditorFunction>()
  const ignoreNextChange = useRef(false)
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false)
  const getMarkdownPlugin = useRef<GetMarkdownPluginInterface | null>(null)

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

  const [lineHeight, setLineHeight] = useState<EditorLineHeight>(PrefDefaults[PrefKey.EditorLineHeight])

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

  const reloadPreferences = useCallback(() => {
    const lineHeight = application.getPreference(PrefKey.EditorLineHeight, PrefDefaults[PrefKey.EditorLineHeight])

    setLineHeight(lineHeight)
  }, [application])

  useEffect(() => {
    reloadPreferences()

    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      reloadPreferences()
    })
  }, [reloadPreferences, application])

  return (
    <div className="relative h-full w-full">
      <ErrorBoundary>
        <>
          <LinkingControllerProvider controller={linkingController}>
            <FilesControllerProvider controller={filesController}>
              <BlocksEditorComposer
                readonly={note.current.locked}
                initialValue={note.current.text}
                nodes={[FileNode, BubbleNode]}
              >
                <BlocksEditor
                  onChange={handleChange}
                  ignoreFirstChange={true}
                  className="relative h-full resize-none px-6 py-4 text-base focus:shadow-none focus:outline-none"
                  previewLength={NotePreviewCharLimit}
                  spellcheck={spellcheck}
                  lineHeight={lineHeight}
                >
                  <ItemSelectionPlugin currentNote={note.current} />
                  <FilePlugin />
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
                  <ExportPlugin />
                  {controller.isTemplateNote ? <AutoFocusPlugin /> : null}
                </BlocksEditor>
              </BlocksEditorComposer>
            </FilesControllerProvider>
          </LinkingControllerProvider>

          {showMarkdownPreview && <SuperNoteMarkdownPreview note={note.current} closeDialog={closeMarkdownPreview} />}
        </>
      </ErrorBoundary>
    </div>
  )
}
