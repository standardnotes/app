import { getScrollParent } from '@/Utils'
import { SuperEditorContentId } from '@/Components/SuperEditor/Constants'
import { hasVerticalOverflow } from './isScrolledToBottom'
import type { NoteEditorScrollContext } from './types'

function resolveScrollElement(element: HTMLElement): HTMLElement {
  if (hasVerticalOverflow(element)) {
    return element
  }

  return getScrollParent(element) ?? element
}

export function getNoteEditorScrollElement({
  editorMode,
  editorContentElement,
  plainEditor,
}: NoteEditorScrollContext): HTMLElement | null {
  switch (editorMode) {
    case 'plain': {
      return plainEditor?.getTextarea() ?? null
    }
    case 'super': {
      if (!editorContentElement) {
        return null
      }

      const contentEditableRoot =
        editorContentElement.querySelector<HTMLElement>(`#${SuperEditorContentId}`) ??
        editorContentElement.querySelector<HTMLElement>('.ContentEditable__root')

      if (!contentEditableRoot) {
        return editorContentElement
      }

      return resolveScrollElement(contentEditableRoot)
    }
    case 'component': {
      return editorContentElement ?? null
    }
    default: {
      return null
    }
  }
}
