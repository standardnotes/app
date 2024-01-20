import { WebAppEvent } from '@standardnotes/snjs'

export class VisibilityObserver {
  private raceTimeout?: ReturnType<typeof setTimeout>

  constructor(private onEvent: (event: WebAppEvent) => void) {
    /**
     * Browsers may handle focus and visibilitychange events differently.
     * Focus better handles window focus events but may not handle tab switching.
     * We will listen for both and debouce notifying so that the most recent event wins.
     */
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    window.addEventListener('focus', this.onFocusEvent, false)
    window.addEventListener('blur', this.onBlurEvent, false)
  }

  onVisibilityChange = () => {
    const visible = document.visibilityState === 'visible'
    const event = visible ? WebAppEvent.WindowDidFocus : WebAppEvent.WindowDidBlur
    this.notifyEvent(event)
  }

  onFocusEvent = () => {
    this.notifyEvent(WebAppEvent.WindowDidFocus)
  }

  onBlurEvent = () => {
    this.notifyEvent(WebAppEvent.WindowDidBlur)
  }

  private notifyEvent(event: WebAppEvent): void {
    if (this.raceTimeout) {
      clearTimeout(this.raceTimeout)
    }
    this.raceTimeout = setTimeout(() => {
      this.onEvent(event)
    }, 250)
  }

  deinit(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    window.removeEventListener('focus', this.onFocusEvent)
    window.removeEventListener('blur', this.onBlurEvent)
    ;(this.onEvent as unknown) = undefined
  }
}
