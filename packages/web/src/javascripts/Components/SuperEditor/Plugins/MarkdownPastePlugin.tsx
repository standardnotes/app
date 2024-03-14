import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { objectKlassEquals } from '@lexical/utils'
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND, PasteCommandType } from 'lexical'
import { useEffect } from 'react'
import { $convertFromMarkdownString } from '../Lexical/Utils/MarkdownImport'
import { MarkdownTransformers } from '../MarkdownTransformers'

export function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: PasteCommandType | DragEvent) => {
        let dataTransfer: null | DataTransfer = null
        if (objectKlassEquals(event, DragEvent)) {
          dataTransfer = (event as DragEvent).dataTransfer
        } else if (objectKlassEquals(event, ClipboardEvent)) {
          dataTransfer = (event as ClipboardEvent).clipboardData
        }

        if (dataTransfer === null) {
          return false
        }

        const hasFiles = dataTransfer.types.includes('Files')
        const hasHTML = dataTransfer.types.includes('text/html')
        const hasText = dataTransfer.types.includes('text/plain')

        if (hasHTML || hasFiles || !hasText) {
          return false
        }

        const textContent = dataTransfer.getData('text/plain')

        try {
          $convertFromMarkdownString(textContent, MarkdownTransformers, undefined, true)
          return true
        } catch (error) {
          console.error(error)
        }

        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}
