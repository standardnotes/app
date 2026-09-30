import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'

export type NoteEditorMode = 'plain' | 'super' | 'component'

export type NoteEditorScrollContext = {
  editorMode: NoteEditorMode
  editorContentElement: HTMLElement | null | undefined
  plainEditor?: PlainEditorInterface
}

export type ScrollNoteToBottomOptions = {
  behavior?: ScrollBehavior
  /** Required for super notes; provided by SuperEditor (Lexical scroll-to-end). */
  superScrollToEnd?: () => void
}
