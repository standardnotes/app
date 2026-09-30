import { scrollComponentEditorToBottom } from './scrollComponentEditorToBottom'
import { scrollPlainEditorToBottom } from './scrollPlainEditorToBottom'
import type { NoteEditorScrollContext, ScrollNoteToBottomOptions } from './types'

export function scrollNoteToBottom(context: NoteEditorScrollContext, options?: ScrollNoteToBottomOptions): boolean {
  const behavior = options?.behavior ?? 'smooth'

  switch (context.editorMode) {
    case 'plain': {
      if (!context.plainEditor) {
        return false
      }

      return scrollPlainEditorToBottom(context.plainEditor)
    }
    case 'super': {
      if (!options?.superScrollToEnd) {
        return false
      }

      options.superScrollToEnd()
      return true
    }
    case 'component': {
      if (!context.editorContentElement) {
        return false
      }

      return scrollComponentEditorToBottom(context.editorContentElement, behavior)
    }
    default: {
      return false
    }
  }
}
