import { NativeLocalizationState } from '@standardnotes/snjs'
type ReactNativeDeviceBridge = {
  syncMobileLocalization?: (state: NativeLocalizationState) => Promise<void>
}

export function syncMobileNativeLocalization(state: NativeLocalizationState): void {
  const device = window.reactNativeDevice as ReactNativeDeviceBridge | undefined
  if (!device?.syncMobileLocalization) {
    return
  }

  void device.syncMobileLocalization(state).catch((error) => {
    console.error('Failed to sync mobile native localization', error)
  })
}
