import { NativeLocalizationState } from '@standardnotes/snjs'
import { isDesktopApplication } from '@/Utils'

type DesktopRemoteBridge = {
  syncMainProcessLocalization?: (state: NativeLocalizationState) => Promise<void>
}

export function syncDesktopMainProcessLocalization(state: NativeLocalizationState): void {
  if (!isDesktopApplication()) {
    return
  }

  const bridge = window.electronRemoteBridge as DesktopRemoteBridge | undefined
  if (!bridge?.syncMainProcessLocalization) {
    return
  }

  void bridge.syncMainProcessLocalization(state).catch((error) => {
    console.error('Failed to sync desktop main process localization', error)
  })
}
