import { ReactNativeToWebEvent } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export type NativeMobileEventListener = (event: ReactNativeToWebEvent) => void

export class MobileWebReceiver {
  private listeners: Set<NativeMobileEventListener> = new Set()

  constructor(private application: WebApplicationInterface) {
    this.listenForNativeMobileEvents()
  }

  deinit() {
    ;(this.application as unknown) = undefined
    window.removeEventListener('message', this.handleNativeMobileWindowMessage)
    document.removeEventListener('message', this.handleNativeMobileWindowMessage as never)
  }

  listenForNativeMobileEvents() {
    const iOSEventRecipient = window
    const androidEventRecipient = document
    iOSEventRecipient.addEventListener('message', this.handleNativeMobileWindowMessage)
    androidEventRecipient.addEventListener('message', this.handleNativeMobileWindowMessage as never)
  }

  handleNativeMobileWindowMessage = (event: MessageEvent) => {
    const nullOrigin = event.origin === '' || event.origin == null
    if (!nullOrigin) {
      return
    }

    const message = (event as MessageEvent).data

    try {
      const parsed = JSON.parse(message)
      const { messageType, reactNativeEvent, messageData } = parsed

      if (messageType === 'event' && reactNativeEvent) {
        const nativeEvent = reactNativeEvent as ReactNativeToWebEvent
        this.handleNativeEvent(nativeEvent, messageData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('[MobileWebReceiver] Error parsing message from React Native', error)
    }
  }

  addReactListener = (listener: NativeMobileEventListener) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  handleNativeEvent(event: ReactNativeToWebEvent, messageData?: unknown) {
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
      case ReactNativeToWebEvent.AndroidBackButtonPressed:
        void this.application.handleAndroidBackButtonPressed()
        break
      case ReactNativeToWebEvent.ColorSchemeChanged:
        void this.application.handleMobileColorSchemeChangeEvent()
        break
      case ReactNativeToWebEvent.KeyboardFrameWillChange:
        void this.application.handleMobileKeyboardWillChangeFrameEvent(
          messageData as { height: number; contentHeight: number; isFloatingKeyboard: boolean },
        )
        break
      case ReactNativeToWebEvent.KeyboardFrameDidChange:
        void this.application.handleMobileKeyboardDidChangeFrameEvent(
          messageData as { height: number; contentHeight: number },
        )
        break
      case ReactNativeToWebEvent.ReceivedFile:
        void this.application.handleReceivedFileEvent(
          messageData as {
            name: string
            mimeType: string
            data: string
          },
        )
        break
      case ReactNativeToWebEvent.ReceivedText:
        void this.application.handleReceivedTextEvent(messageData as { text: string })
        break
      case ReactNativeToWebEvent.ReceivedLink:
        void this.application.handleReceivedLinkEvent(messageData as { link: string; title: string })
        break
      case ReactNativeToWebEvent.OpenFilePreview:
        void this.application.handleOpenFilePreviewEvent(messageData as { id: string })
        break
      default:
        break
    }

    this.listeners.forEach((listener) => listener(event))
  }
}
