import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useEffect } from 'react'
import { FileNode } from './Nodes/FileNode'
import { $createFileNode } from './Nodes/FileUtils'
import { INSERT_FILE_COMMAND } from '@standardnotes/blocks-editor'

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
        $insertNodeToNearestRoot(fileNode)

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
