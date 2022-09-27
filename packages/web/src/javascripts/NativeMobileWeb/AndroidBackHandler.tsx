type Listener = () => void
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
    const latestListener = Array.from(this.listeners)[this.listeners.size - 1]
    latestListener()
  }
}
