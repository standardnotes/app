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

export default function FilePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const filesController = useFilesController()

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor')
    }

    const uploadFilesList = (files: FileList) => {
      Array.from(files).forEach(async (file) => {
        try {
          const uploadedFiles = await filesController.uploadNewFile(file)
          if (uploadedFiles) {
            uploadedFiles.forEach((uploadedFile) => {
              editor.dispatchCommand(INSERT_FILE_COMMAND, uploadedFile.uuid)
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
  }, [editor, filesController])

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
