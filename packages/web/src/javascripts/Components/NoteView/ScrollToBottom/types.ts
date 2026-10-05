import type { Disposer } from '@/Types/Disposer'

export type NoteEditorMode = 'plain' | 'super' | 'component'

export type ScrollableEditor = {
  getScrollElement: () => HTMLElement | null
  scrollToEnd: () => void
  onTextChange: (callback: () => void) => Disposer
}
