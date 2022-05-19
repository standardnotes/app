import { WebOrDesktopDevice } from './WebOrDesktopDevice'

export type StartApplication = (
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) => Promise<void>
