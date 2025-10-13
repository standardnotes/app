import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $getSelection, COMMAND_PRIORITY_NORMAL, PASTE_COMMAND } from 'lexical'
import { $insertDataTransferForRichText } from '@lexical/clipboard'

export default function GoogleDocsPastePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) {
          return false
        }

        const html = event.clipboardData?.getData('text/html')
        if (!html) {
          return false
        }

        const selection = $getSelection()
        if (!selection) {
          return false
        }

        const googleDocRegex = /<b.* id="docs-internal-guid-\S*">/i
        if (!googleDocRegex.test(html)) {
          return false
        }

        let cleaned = html.replace(googleDocRegex, '')
        cleaned = cleaned.replace('</b>', '')

        const plain = event.clipboardData?.getData('text/plain') ?? ''
        const dataTransferShim = {
          getData: (type: string) => (type === 'text/html' ? cleaned : plain),
          types: ['text/html', 'text/plain'],
        } as unknown as DataTransfer

        event.preventDefault()
        $insertDataTransferForRichText(dataTransferShim, selection, editor)
        return true
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [editor])

  return null
}
