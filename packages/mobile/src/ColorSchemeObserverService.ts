import { AbstractService, InternalEventBus, ReactNativeToWebEvent } from '@standardnotes/snjs'
import { Appearance, NativeEventSubscription } from 'react-native'

export class ColorSchemeObserverService extends AbstractService<ReactNativeToWebEvent> {
  private removeListener: NativeEventSubscription

  constructor() {
    const internalEventBus = new InternalEventBus()
    super(internalEventBus)

    this.removeListener = Appearance.addChangeListener(() => {
      void this.notifyEvent(ReactNativeToWebEvent.ColorSchemeChanged)
    })
  }

  deinit() {
    this.removeListener.remove()
  }
}
