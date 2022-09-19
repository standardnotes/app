import { AbstractService, InternalEventBus, ReactNativeToWebEvent } from '@standardnotes/snjs'
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native'

export class AppStateObserverService extends AbstractService<ReactNativeToWebEvent> {
  private mostRecentState?: ReactNativeToWebEvent
  private removeListener: NativeEventSubscription
  private ignoringStateChanges = false

  constructor() {
    const bus = new InternalEventBus()
    super(bus)

    this.removeListener = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (this.ignoringStateChanges) {
        return
      }

      // if the most recent state is not 'background' ('inactive'), then we're going
      // from inactive to active, which doesn't really happen unless you, say, swipe
      // notification center in iOS down then back up. We don't want to lock on this state change.
      const isResuming = nextAppState === 'active'
      const isResumingFromBackground = isResuming && this.mostRecentState === ReactNativeToWebEvent.EnteringBackground
      const isEnteringBackground = nextAppState === 'background'
      const isLosingFocus = nextAppState === 'inactive'

      if (isEnteringBackground) {
        this.notifyStateChange(ReactNativeToWebEvent.EnteringBackground)
      }

      if (isResumingFromBackground || isResuming) {
        if (isResumingFromBackground) {
          this.notifyStateChange(ReactNativeToWebEvent.ResumingFromBackground)
        }

        // Notify of GainingFocus even if resuming from background
        this.notifyStateChange(ReactNativeToWebEvent.GainingFocus)
        return
      }

      if (isLosingFocus) {
        this.notifyStateChange(ReactNativeToWebEvent.LosingFocus)
      }
    })
  }

  beginIgnoringStateChanges() {
    this.ignoringStateChanges = true
  }

  stopIgnoringStateChanges() {
    this.ignoringStateChanges = false
  }

  deinit() {
    this.removeListener.remove()
  }

  private notifyStateChange(state: ReactNativeToWebEvent): void {
    this.mostRecentState = state
    void this.notifyEvent(state)
  }
}
