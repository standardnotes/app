import { INSERT_FILE_COMMAND } from './../Commands'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEffect } from 'react'
import { FileNode } from './Nodes/FileNode'
import { $createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { $createFileNode } from './Nodes/FileUtils'
import { $wrapNodeInElement } from '@lexical/utils'
import { useFilesController } from '@/Controllers/FilesControllerProvider'
import { FilesControllerEvent } from '@/Controllers/FilesController'

export default function FilePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const filesController = useFilesController()

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor')
    }

    return editor.registerCommand<string>(
      INSERT_FILE_COMMAND,
      (payload) => {
        const fileNode = $createFileNode(payload)
        $insertNodes([fileNode])
        if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
          $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

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
