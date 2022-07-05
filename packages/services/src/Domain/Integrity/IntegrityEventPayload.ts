import { ServerItemResponse } from '@standardnotes/responses'
import { SyncSource } from '../Sync/SyncSource'

export type IntegrityEventPayload = {
  rawPayloads: ServerItemResponse[]
  source: SyncSource
}
