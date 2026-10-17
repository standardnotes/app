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
    const keyboardTarget = editor?.getKeyboardTarget?.()
    if (!editor || !keyboardTarget) {
      return
    }

    return keyboardService.addCommandHandler({
      command: SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND,
      category: 'Current note',
      description: c('B4.Notes.EditingUI.Action').t`Scroll to bottom of note`,
      element: keyboardTarget,
      onKeyDown: (event) => {
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
