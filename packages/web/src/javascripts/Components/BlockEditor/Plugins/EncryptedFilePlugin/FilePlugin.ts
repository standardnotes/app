import { INSERT_FILE_COMMAND } from './../Commands'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEffect } from 'react'
import { FileNode } from './Nodes/FileNode'
import { $createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { $createFileNode } from './Nodes/FileUtils'
import { $wrapNodeInElement } from '@lexical/utils'

export default function FilePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor')
    }

    return editor.registerCommand<string>(
      INSERT_FILE_COMMAND,
      (payload) => {
        const fileNode = $createFileNode(payload)
        // $insertNodeToNearestRoot(fileNode)
        $insertNodes([fileNode])
        if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
          $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
