import { FullyFormedPayloadInterface } from '../../../Abstract/Payload'

export interface SyncResolvedParams {
  dirty: boolean
  lastSyncEnd: Date
}

export function BuildSyncResolvedParams(params: SyncResolvedParams): SyncResolvedParams {
  return params
}

export type SyncResolvedPayload = SyncResolvedParams & FullyFormedPayloadInterface
