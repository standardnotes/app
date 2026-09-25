export type MobileNativeLocalizationState = {
  localizationEnabled: boolean
  locale?: string | null
}

type ReactNativeDeviceBridge = {
  syncMobileLocalization?: (state: MobileNativeLocalizationState) => Promise<void>
}

export function syncMobileNativeLocalization(state: MobileNativeLocalizationState): void {
  const device = window.reactNativeDevice as ReactNativeDeviceBridge | undefined
  if (!device?.syncMobileLocalization) {
    return
  }

  void device.syncMobileLocalization(state).catch((error) => {
    console.error('Failed to sync mobile native localization', error)
  })
}
