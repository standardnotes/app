import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  $isTextNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical'
import { useCallback, useEffect, useRef } from 'react'
import { getSelectedNode } from '../Lexical/Utils/getSelectedNode'
import { mergeRegister } from '@lexical/utils'

export const EmptyLinePlaceholderPlugin = () => {
  const [editor] = useLexicalComposerContext()

  const placeholderElementRef = useRef<HTMLDivElement>(null)

  const cursorUpdate = useCallback((): boolean => {
    const selection = $getSelection()
    if (selection && $isRangeSelection(selection)) {
      if (!placeholderElementRef.current) {
        return false
      }
      const node = getSelectedNode(selection)
      if (!node) {
        return false
      }
      const isParagraph = $isParagraphNode(node) || $isTextNode(node)
      const text = node.getTextContent()
      if (!isParagraph) {
        return false
      }
      const rootElement = editor.getRootElement()
      const nodeElement = editor.getElementByKey(node.getKey())
      const placeholder = placeholderElementRef.current
      if (!nodeElement || !placeholder.parentElement || !rootElement) {
        return false
      }
      const rect = nodeElement.getBoundingClientRect()
      const parentRect = placeholder.parentElement.getBoundingClientRect()
      const rootRect = rootElement.getBoundingClientRect()
      if (!text && editor.isEditable()) {
        placeholder.style.top = `${rect.y}px`
        placeholder.style.left = `${rect.x - parentRect.x + rootRect.x}px`
        placeholder.style.opacity = '1'
      } else {
        placeholder.style.opacity = '0'
      }
    }

    return false
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(SELECTION_CHANGE_COMMAND, cursorUpdate, COMMAND_PRIORITY_LOW),
      editor.registerEditableListener(cursorUpdate),
    )
  }, [cursorUpdate, editor])

  useEffect(() => {
    const scrollerElem = editor.getRootElement()

    const update = () => {
      editor.getEditorState().read(() => {
        cursorUpdate()
      })
    }

    window.addEventListener('resize', update)
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [cursorUpdate, editor])

  return (
    <div
      className="super-empty-line-placeholder pointer-events-none fixed text-passive-1 opacity-0"
      ref={placeholderElementRef}
    >
      Type <span className="rounded border border-border bg-passive-4-opacity-variant px-1 py-0.5">/</span> for
      commands...
    </div>
  )
}
