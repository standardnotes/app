import { WebAppEvent } from '@standardnotes/snjs'
import { isDesktopApplication } from '@/Utils'
export class FocusObserver {
  private onVisibilityChange: () => void

  constructor(onEvent: (event: WebAppEvent) => void) {
    this.onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      const event = visible ? WebAppEvent.WindowDidFocus : WebAppEvent.WindowDidBlur
      onEvent(event)
    }

    if (!isDesktopApplication()) {
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }

    window.addEventListener('focus', () => {}, false)
  }

  deinit(): void {
    if (!isDesktopApplication()) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  }
}
