/* istanbul ignore file */

import { SyncMode } from './SyncMode'
import { SyncQueueStrategy } from './SyncQueueStrategy'
import { SyncSource } from './SyncSource'

export type SyncOptions = {
  queueStrategy?: SyncQueueStrategy
  mode?: SyncMode
  /** Whether the server should compute and return an integrity hash. */
  checkIntegrity?: boolean
  /** Internally used to keep track of how sync requests were spawned. */
  source: SyncSource
  sourceDescription?: string
  /** Whether to await any sync requests that may be queued from this call. */
  awaitAll?: boolean
  /**
   * A callback that is triggered after pre-sync save completes,
   * and before the sync request is network dispatched
   */
  onPresyncSave?: () => void

  /** If supplied, the sync will be exclusive to items in these sharedVaults */
  sharedVaultUuids?: string[]

  /** If true and sharedVaultUuids is present, excludes sending global syncToken as part of request */
  syncSharedVaultsFromScratch?: boolean
}
