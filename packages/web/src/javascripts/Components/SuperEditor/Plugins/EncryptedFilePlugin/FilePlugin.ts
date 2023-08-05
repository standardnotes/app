import { INSERT_FILE_COMMAND } from '../Commands'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEffect } from 'react'
import { FileNode } from './Nodes/FileNode'
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  PASTE_COMMAND,
} from 'lexical'
import { $createFileNode } from './Nodes/FileUtils'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import { useFilesController } from '@/Controllers/FilesControllerProvider'
import { FilesControllerEvent } from '@/Controllers/FilesController'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import { useApplication } from '@/Components/ApplicationProvider'
import { SNNote } from '@standardnotes/snjs'

export default function FilePlugin({ currentNote }: { currentNote: SNNote }): JSX.Element | null {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const filesController = useFilesController()
  const linkingController = useLinkingController()

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor')
    }

    const uploadFilesList = (files: FileList) => {
      Array.from(files).forEach(async (file) => {
        try {
          const uploadedFile = await filesController.uploadNewFile(file)
          if (uploadedFile) {
            editor.dispatchCommand(INSERT_FILE_COMMAND, uploadedFile.uuid)
            void linkingController.linkItemToSelectedItem(uploadedFile)
            void application.changeAndSaveItem.execute(uploadedFile, (mutator) => {
              mutator.protected = currentNote.protected
            })
          }
        } catch (error) {
          console.error(error)
        }
      })
    }

    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const fileNode = $createFileNode(payload)
          $insertNodes([fileNode])
          if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
            $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd()
          }
          const newLineNode = $createParagraphNode()
          $insertNodes([newLineNode])

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (payload) => {
          const files = payload instanceof ClipboardEvent ? payload.clipboardData?.files : null
          if (files?.length) {
            uploadFilesList(files)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [application, currentNote.protected, editor, filesController, linkingController])

  useEffect(() => {
    const disposer = filesController.addEventObserver((event, data) => {
      if (event === FilesControllerEvent.FileUploadedToNote) {
        const fileUuid = data[FilesControllerEvent.FileUploadedToNote].uuid
        editor.dispatchCommand(INSERT_FILE_COMMAND, fileUuid)
      }
    })

    return disposer
  }, [filesController, editor])

  return null
}
