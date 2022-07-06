import { ServerSyncResponse } from '@Lib/Services/Sync/Account/Response'
import { OfflineSyncResponse } from './Offline/Response'

export enum SyncSignal {
  Response = 1,
  StatusChanged = 2,
}

export type SyncStats = {
  completedUploadCount: number
  totalUploadCount: number
}

export type ResponseSignalReceiver<T extends ServerSyncResponse | OfflineSyncResponse> = (
  signal: SyncSignal,
  response?: T,
  stats?: SyncStats,
) => Promise<void>
