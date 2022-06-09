import { SCREEN_COMPOSE, SCREEN_NOTES } from '@Root/Screens/screens'
import { ApplicationService, removeFromArray } from '@standardnotes/snjs'

export type ScreenStatus = {
  status: string
  color?: string
}
type StatusState = {
  [SCREEN_NOTES]: ScreenStatus
  [SCREEN_COMPOSE]: ScreenStatus
}
type HeaderStatusObserverCallback = (status: StatusState) => void

export class StatusManager extends ApplicationService {
  private messages: StatusState = {
    [SCREEN_NOTES]: {
      status: '',
    },
    [SCREEN_COMPOSE]: {
      status: '',
    },
  }
  private observers: HeaderStatusObserverCallback[] = []

  override deinit() {
    this.observers = []
    this.messages = {
      [SCREEN_NOTES]: {
        status: '',
      },
      [SCREEN_COMPOSE]: {
        status: '',
      },
    }
  }

  /**
   * Registers an observer for UI header status change
   * @returns function that unregisters this observer
   */
  public addHeaderStatusObserver(callback: HeaderStatusObserverCallback) {
    this.observers.push(callback)
    return () => {
      removeFromArray(this.observers, callback)
    }
  }

  setMessage(screen: typeof SCREEN_COMPOSE | typeof SCREEN_NOTES, message: string, color?: string) {
    this.messages[screen] = {
      status: message,
      color,
    }
    this.notifyObservers()
  }

  hasMessage(screen: typeof SCREEN_COMPOSE | typeof SCREEN_NOTES) {
    const message = this.getMessage(screen)
    if (!message || message.status.length === 0) {
      return false
    }
    return true
  }

  getMessage(screen: typeof SCREEN_COMPOSE | typeof SCREEN_NOTES) {
    return this.messages[screen]
  }

  private notifyObservers() {
    for (const observer of this.observers) {
      observer(this.messages)
    }
  }
}
