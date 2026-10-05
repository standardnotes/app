import type { SuperEditorInterface } from '@/Components/SuperEditor/SuperEditor'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'

export type NoteEditorMode = 'plain' | 'super' | 'component'

export type NoteEditorScrollContext = {
  editorMode: NoteEditorMode
  editorContentElement: HTMLElement | null | undefined
  plainEditor?: PlainEditorInterface
  superEditor?: SuperEditorInterface
}

export type ScrollNoteToBottomOptions = {
  behavior?: ScrollBehavior
}
