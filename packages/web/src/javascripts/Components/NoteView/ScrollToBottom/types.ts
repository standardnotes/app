import type { ComponentScrollState } from '@standardnotes/snjs'
import type { Disposer } from '@/Types/Disposer'

export type ScrollToEndOptions = {
  moveCaret: boolean
}

export type ScrollableEditor = {
  observeScrollState: (callback: (state: ComponentScrollState) => void) => Disposer
  scrollToEnd: (options: ScrollToEndOptions) => void
  /** Element that has focus while the user types in the editor */
  getKeyboardTarget: () => HTMLElement | null
}
