import { Bridge } from './Services/Bridge'

export type StartApplication = (
  defaultSyncServerHost: string,
  bridge: Bridge,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string,
) => Promise<void>
