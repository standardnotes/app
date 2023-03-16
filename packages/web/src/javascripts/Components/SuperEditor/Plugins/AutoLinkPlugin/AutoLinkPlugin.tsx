import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { AutoLinkPlugin as LexicalAutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin'
import { COMMAND_PRIORITY_EDITOR, KEY_MODIFIER_COMMAND, $getSelection } from 'lexical'
import { useEffect } from 'react'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text)
    if (match === null) {
      return null
    }
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
    }
  },
]

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

  return (
    <>
      <LexicalAutoLinkPlugin matchers={MATCHERS} />
    </>
  )
}
