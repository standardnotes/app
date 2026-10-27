export type ComponentScrollState = {
  canScroll: boolean
  isAtBottom: boolean
  /** Space between the scroll container and the bottom of the editor, e.g. a toolbar the host must not cover */
  bottomInset?: number
}
