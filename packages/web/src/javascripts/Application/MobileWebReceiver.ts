import { ReactNativeToWebEvent, WebApplicationInterface } from '@standardnotes/snjs'

export class MobileWebReceiver {
  constructor(private application: WebApplicationInterface) {
    this.listenForNativeMobileEvents()
  }

  deinit() {
    ;(this.application as unknown) = undefined
    window.removeEventListener('message', this.handleNativeMobileWindowMessage)
  }

  listenForNativeMobileEvents() {
    window.addEventListener('message', this.handleNativeMobileWindowMessage)
  }

  handleNativeMobileWindowMessage = (event: MessageEvent) => {
    const message = event.data

    try {
      const parsed = JSON.parse(message)
      const { messageType, reactNativeEvent } = parsed

      if (messageType === 'event' && reactNativeEvent) {
        const nativeEvent = reactNativeEvent as ReactNativeToWebEvent
        this.handleNativeEvent(nativeEvent)
      }
    } catch (error) {
      console.log('Error parsing message from React Native', message, error)
    }
  }

  handleNativeEvent(event: ReactNativeToWebEvent) {
    switch (event) {
      case ReactNativeToWebEvent.EnteringBackground:
        void this.application.handleMobileEnteringBackgroundEvent()
        break
      case ReactNativeToWebEvent.GainingFocus:
        void this.application.handleMobileGainingFocusEvent()
        break
      case ReactNativeToWebEvent.LosingFocus:
        void this.application.handleMobileLosingFocusEvent()
        break
      case ReactNativeToWebEvent.ResumingFromBackground:
        void this.application.handleMobileResumingFromBackgroundEvent()
        break

      default:
        break
    }
  }
}
