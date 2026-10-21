import type { Disposer } from '@/Types/Disposer'

export type NoteEditorMode = 'plain' | 'super' | 'component'

export type ScrollToEndOptions = {
  moveCaret: boolean
}

export type ScrollState = {
  canScroll: boolean
  isAtBottom: boolean
}

export type ScrollableEditor = {
  observeScrollState: (callback: (state: ScrollState) => void) => Disposer
  scrollToEnd: (options: ScrollToEndOptions) => void
  /** Element that has focus while the editor receives keyboard input */
  getKeyboardTarget: () => HTMLElement | null
}
