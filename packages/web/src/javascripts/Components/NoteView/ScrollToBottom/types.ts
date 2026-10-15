import type { Disposer } from '@/Types/Disposer'

export type NoteEditorMode = 'plain' | 'super' | 'component'

export type ScrollToEndOptions = {
  moveCaret: boolean
}

export type ScrollableEditor = {
  getScrollElement: () => HTMLElement | null
  scrollToEnd: (options: ScrollToEndOptions) => void
  onTextChange: (callback: () => void) => Disposer
}
