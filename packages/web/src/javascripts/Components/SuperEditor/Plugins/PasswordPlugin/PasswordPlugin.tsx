import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  COMMAND_PRIORITY_EDITOR,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from 'lexical'
import { useEffect } from 'react'
import { INSERT_PASSWORD_COMMAND } from '../Commands'
import { mergeRegister } from '@lexical/utils'
import { generatePassword } from './Generator'

export default function PasswordPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_PASSWORD_COMMAND,
        (lengthString) => {
          const length = Number(lengthString)
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return false
          }

          const paragraph = $createParagraphNode()
          const password = generatePassword(length)
          paragraph.append($createTextNode(password))
          selection.insertNodes([paragraph])
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}
