import { useKeyboardService } from '@/Components/KeyboardServiceProvider'
import { SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { useEffect, useState } from 'react'
import { c } from 'ttag'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import type { ScrollableEditor } from './types'

type Props = {
  editor: ScrollableEditor | undefined
  moveCaret: boolean
}

export function NoteScrollToBottomController({ editor, moveCaret }: Props) {
  const keyboardService = useKeyboardService()
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    setShowButton(false)
    if (!editor) {
      return
    }

    return editor.observeScrollState(({ canScroll, isAtBottom }) => {
      setShowButton(canScroll && !isAtBottom)
    })
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    return keyboardService.addCommandHandler({
      command: SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND,
      category: 'Current note',
      description: c('B4.Notes.EditingUI.Action').t`Scroll to bottom of note`,
      onKeyDown: (event) => {
        // Shortcuts forwarded from component iframes have no target, and the iframe is focused while typing in it
        if (document.activeElement !== editor.getKeyboardTarget()) {
          return
        }
        event.preventDefault()
        editor.scrollToEnd({ moveCaret })
      },
    })
  }, [editor, moveCaret, keyboardService])

  if (!editor || !showButton) {
    return null
  }

  return <ScrollToBottomButton onClick={() => editor.scrollToEnd({ moveCaret })} />
}
