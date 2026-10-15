import { useKeyboardService } from '@/Components/KeyboardServiceProvider'
import { SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { useEffect, useState } from 'react'
import { c } from 'ttag'
import { hasVerticalOverflow, isScrolledToBottom } from './isScrolledToBottom'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import type { ScrollableEditor } from './types'

type Props = {
  editor: ScrollableEditor | undefined
  disabled: boolean
  moveCaret: boolean
}

export function NoteScrollToBottomController({ editor, disabled, moveCaret }: Props) {
  const keyboardService = useKeyboardService()
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const scrollElement = disabled ? null : editor?.getScrollElement()
    if (!editor || !scrollElement) {
      setShowButton(false)
      return
    }

    const refresh = () => {
      setShowButton(hasVerticalOverflow(scrollElement) && !isScrolledToBottom(scrollElement))
    }
    refresh()

    scrollElement.addEventListener('scroll', refresh, { passive: true })
    const resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(scrollElement)
    const disposeTextChangeObserver = editor.onTextChange(refresh)

    return () => {
      scrollElement.removeEventListener('scroll', refresh)
      resizeObserver.disconnect()
      disposeTextChangeObserver()
    }
  }, [editor, disabled])

  useEffect(() => {
    const scrollElement = disabled ? null : editor?.getScrollElement()
    if (!editor || !scrollElement) {
      return
    }

    return keyboardService.addCommandHandler({
      command: SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND,
      category: 'Current note',
      description: c('B4.Notes.EditingUI.Action').t`Scroll to bottom of note`,
      element: scrollElement,
      onKeyDown: (event) => {
        event.preventDefault()
        editor.scrollToEnd({ moveCaret })
      },
    })
  }, [editor, disabled, moveCaret, keyboardService])

  if (!editor || !showButton) {
    return null
  }

  return <ScrollToBottomButton onClick={() => editor.scrollToEnd({ moveCaret })} />
}
