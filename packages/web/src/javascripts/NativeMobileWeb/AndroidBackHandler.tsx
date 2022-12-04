type Listener = () => boolean
type RemoveListener = () => void

export class AndroidBackHandler {
  private listeners = new Set<Listener>()
  private fallbackListener: Listener | undefined

  setFallbackListener(listener: Listener) {
    this.fallbackListener = listener
  }

  addEventListener(listener: Listener): RemoveListener {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  notifyEvent() {
    let handled = false
    for (const listener of Array.from(this.listeners).reverse()) {
      if (listener()) {
        handled = true
        return
      } else {
        handled = false
      }
    }
    if (!handled && this.fallbackListener) {
      this.fallbackListener()
    }
  }
}
