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
    console.log('handleNativeMobileWindowMessage', message)

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
        this.application.handleMobileEnteringBackgroundEvent()
        break
      case ReactNativeToWebEvent.GainingFocus:
        this.application.handleMobileGainingFocusEvent()
        break
      case ReactNativeToWebEvent.LosingFocus:
        this.application.handleMobileLosingFocusEvent()
        break
      case ReactNativeToWebEvent.ResumingFromBackground:
        this.application.handleMobileResumingFromBackgroundEvent()
        break

      default:
        break
    }
  }
}
