type Listener = () => boolean
type RemoveListener = () => void

export class AndroidBackHandler {
  private listeners = new Set<Listener>()

  constructor() {
    //
  }

  addEventListener(listener: Listener): RemoveListener {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  notifyEvent() {
    for (const listener of Array.from(this.listeners).reverse()) {
      if (listener()) {
        return
      }
    }
  }
}
