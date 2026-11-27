import { useKeyboardService } from '@/Components/KeyboardServiceProvider'
import usePreference from '@/Hooks/usePreference'
import { ComponentViewerInterface, PrefKey } from '@standardnotes/snjs'
import { SCROLL_NOTE_TO_BOTTOM_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'
import { ScrollToBottomButton } from './ScrollToBottomButton'
import { createComponentScrollableEditor } from './scrollableEditors'
import { isFocusInEditor } from './scrollToBottomUtils'
import type { ScrollableEditor } from './types'

type Props = {
  editor: ScrollableEditor | undefined
  moveCaret: boolean
}

export function NoteScrollToBottomController({ editor, moveCaret }: Props) {
  const keyboardService = useKeyboardService()
  const isButtonEnabled = usePreference(PrefKey.ShowScrollToBottomButton)
  const [showButton, setShowButton] = useState(false)
  const [bottomInset, setBottomInset] = useState(0)

  useEffect(() => {
    setShowButton(false)
    setBottomInset(0)
    if (!editor) {
      return
    }

    return editor.observeScrollState(({ canScroll, isAtBottom, bottomInset = 0 }) => {
      setShowButton(canScroll && !isAtBottom)
      setBottomInset(bottomInset)
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
        // Shortcuts forwarded from component iframes have no target, so focus is what tells which editor it's for
        if (!isFocusInEditor(editor)) {
          return
        }
        event.preventDefault()
        editor.scrollToEnd({ moveCaret })
      },
    })
  }, [editor, moveCaret, keyboardService])

  if (!editor || !isButtonEnabled || !showButton) {
    return null
  }

  return <ScrollToBottomButton bottomInset={bottomInset} onClick={() => editor.scrollToEnd({ moveCaret })} />
}

/** Memoized per viewer, so the controller doesn't resubscribe on every render */
export function ComponentScrollToBottomController({
  componentViewer,
  moveCaret,
}: {
  componentViewer: ComponentViewerInterface
  moveCaret: boolean
}) {
  const editor = useMemo(() => createComponentScrollableEditor(componentViewer), [componentViewer])

  return <NoteScrollToBottomController editor={editor} moveCaret={moveCaret} />
}
