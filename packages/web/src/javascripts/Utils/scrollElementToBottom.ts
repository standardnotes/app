const SmoothScrollFallbackMs = 500

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function scrollElementToBottom(element: HTMLElement, onScrollEnd?: () => void): void {
  const top = Math.max(0, element.scrollHeight - element.clientHeight)

  if (prefersReducedMotion() || element.scrollTop >= top - 1) {
    element.scrollTop = top
    onScrollEnd?.()
    return
  }

  let didFinish = false
  const finish = () => {
    if (didFinish) {
      return
    }
    didFinish = true
    // The fallback can fire mid-animation, and later scrollTop writes would otherwise freeze the scroll there
    element.scrollTop = element.scrollHeight - element.clientHeight
    onScrollEnd?.()
  }

  // `scrollend` is not supported everywhere and does not fire if the scroll is interrupted
  element.addEventListener('scrollend', finish, { once: true })
  setTimeout(finish, SmoothScrollFallbackMs)

  element.scrollTo({ top, behavior: 'smooth' })
}
