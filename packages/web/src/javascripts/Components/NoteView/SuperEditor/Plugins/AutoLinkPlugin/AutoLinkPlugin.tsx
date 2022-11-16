import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_EDITOR, KEY_MODIFIER_COMMAND, $getSelection } from 'lexical'
import { useEffect } from 'react'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'

export default function AutoLinkPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event: KeyboardEvent) => {
          const isCmdK = event.key === 'k' && !event.altKey && (event.metaKey || event.ctrlKey)
          if (isCmdK) {
            const selection = $getSelection()
            if (selection) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, selection.getTextContent())
            }
          }

          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}
