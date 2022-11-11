import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef } from 'react'
import { BlockEditorController } from './BlockEditorController'
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
  const controller = useRef(new BlockEditorController(note, application))

  const handleChange = useCallback(
    (value: string, preview: string) => {
      void controller.current.save({ text: value, previewPlain: preview, previewHtml: undefined })
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

  return (
    <div className="relative h-full w-full px-5 py-4">
      <ErrorBoundary>
        <LinkingControllerProvider controller={linkingController}>
          <FilesControllerProvider controller={filesController}>
            <BlocksEditorComposer initialValue={note.text} nodes={[FileNode, BubbleNode]}>
              <BlocksEditor
                onChange={handleChange}
                className="relative relative resize-none text-base focus:shadow-none focus:outline-none"
                previewLength={NotePreviewCharLimit}
                spellcheck={spellcheck}
              >
                <ItemSelectionPlugin currentNote={note} />
                <FilePlugin />
                <ItemBubblePlugin />
                <BlockPickerMenuPlugin />
                <DatetimePlugin />
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
