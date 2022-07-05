/* istanbul ignore file */

import { SyncOptions } from './SyncOptions'

export interface SyncServiceInterface {
  sync(options?: Partial<SyncOptions>): Promise<unknown>
}
