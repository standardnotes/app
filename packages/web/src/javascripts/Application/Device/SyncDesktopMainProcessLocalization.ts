import { isDesktopApplication } from '@/Utils'

export type DesktopMainProcessLocalizationState = {
  localizationEnabled: boolean
  locale?: string | null
}

type DesktopRemoteBridge = {
  syncMainProcessLocalization?: (state: DesktopMainProcessLocalizationState) => Promise<void>
}

export function syncDesktopMainProcessLocalization(state: DesktopMainProcessLocalizationState): void {
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
