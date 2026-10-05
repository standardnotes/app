import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { SuperEditorContentId } from '../../Constants'

export type ScrollToEndPluginInterface = {
  scrollToEnd: (behavior?: ScrollBehavior) => boolean
}

type Props = {
  readonly?: boolean
}

const ScrollToEndPlugin = forwardRef<ScrollToEndPluginInterface, Props>(function ScrollToEndPlugin({ readonly }, ref) {
  const [editor] = useLexicalComposerContext()

  const scrollToEnd = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (readonly) {
        return false
      }

      editor.update(() => {
        $getRoot().selectEnd()
      })
      editor.focus()

      const scrollElement = document.getElementById(SuperEditorContentId)
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior,
        })
      }

      return true
    },
    [editor, readonly],
  )

  useImperativeHandle(
    ref,
    () => ({
      scrollToEnd,
    }),
    [scrollToEnd],
  )

  return null
})

export default ScrollToEndPlugin
