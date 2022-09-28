import { AbstractService, InternalEventBus, ReactNativeToWebEvent } from '@standardnotes/snjs'
import { BackHandler, NativeEventSubscription } from 'react-native'

export class AndroidBackHandlerService extends AbstractService<ReactNativeToWebEvent> {
  private removeListener: NativeEventSubscription

  constructor() {
    const internalEventBus = new InternalEventBus()
    super(internalEventBus)

    this.removeListener = BackHandler.addEventListener('hardwareBackPress', () => {
      void this.notifyEvent(ReactNativeToWebEvent.AndroidBackButtonPressed)

      return true
    })
  }

  deinit() {
    this.removeListener.remove()
  }
}
