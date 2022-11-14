import { WebApplication } from '@/Application/Application'
import { NoteViewController, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef } from 'react'
import { BlocksEditor, BlocksEditorComposer } from '@standardnotes/blocks-editor'
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

const NotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  note: SNNote
  linkingController: LinkingController
  filesController: FilesController
  spellcheck: boolean
}

export const BlockEditor: FunctionComponent<Props> = ({
  note,
  application,
  linkingController,
  filesController,
  spellcheck,
}) => {
  const controller = useRef(new NoteViewController(application, note))

  const handleChange = useCallback(
    (value: string, preview: string) => {
      void controller.current.save({
        editorValues: { title: note.title, text: value },
        previews: {
          previewPlain: preview,
          previewHtml: undefined,
        },
      })
    },
    [controller, note],
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

  return (
    <div className="relative h-full w-full px-5 py-4">
      <ErrorBoundary>
        <LinkingControllerProvider controller={linkingController}>
          <FilesControllerProvider controller={filesController}>
            <BlocksEditorComposer readonly={note.locked} initialValue={note.text} nodes={[FileNode, BubbleNode]}>
              <BlocksEditor
                onChange={handleChange}
                ignoreFirstChange={true}
                className="relative relative resize-none text-base focus:shadow-none focus:outline-none"
                previewLength={NotePreviewCharLimit}
                spellcheck={spellcheck}
              >
                <ItemSelectionPlugin currentNote={note} />
                <FilePlugin />
                <ItemBubblePlugin />
                <BlockPickerMenuPlugin />
                <DatetimePlugin />
                <AutoLinkPlugin />
                <NodeObserverPlugin nodeType={BubbleNode} onRemove={handleBubbleRemove} />
                <NodeObserverPlugin nodeType={FileNode} onRemove={handleBubbleRemove} />
              </BlocksEditor>
            </BlocksEditorComposer>
          </FilesControllerProvider>
        </LinkingControllerProvider>
      </ErrorBoundary>
    </div>
  )
}
