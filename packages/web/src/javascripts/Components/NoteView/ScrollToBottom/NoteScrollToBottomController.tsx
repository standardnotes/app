import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import { useEffect, useState } from 'react'
import { hasVerticalOverflow, isScrolledToBottom } from './isScrolledToBottom'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import type { ScrollableEditor } from './types'

type Props = {
  editor: ScrollableEditor | undefined
  disabled: boolean
}

export function NoteScrollToBottomController({ editor, disabled }: Props) {
  const { hasBottomInset } = useAvailableSafeAreaPadding()
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

  if (!editor || !showButton) {
    return null
  }

  return (
    <ScrollToBottomButton
      onClick={() => editor.scrollToEnd()}
      className={hasBottomInset ? 'mb-safe-bottom' : undefined}
    />
  )
}
