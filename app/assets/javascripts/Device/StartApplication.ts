import { WebOrDesktopDeviceInterface } from '@standardnotes/snjs'

export type StartApplication = (
  defaultSyncServerHost: string,
  device: WebOrDesktopDeviceInterface,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) => Promise<void>
