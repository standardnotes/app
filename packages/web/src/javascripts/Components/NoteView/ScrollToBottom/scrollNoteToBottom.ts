import { scrollComponentEditorToBottom } from './scrollComponentEditorToBottom'
import { scrollPlainEditorToBottom } from './scrollPlainEditorToBottom'
import { scrollSuperEditorToBottom } from './scrollSuperEditorToBottom'
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
      if (!context.superEditor) {
        return false
      }

      return scrollSuperEditorToBottom(context.superEditor, behavior)
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
