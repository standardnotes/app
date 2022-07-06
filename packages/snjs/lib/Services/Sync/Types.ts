import { SyncOptions } from '@standardnotes/services'

export type SyncPromise = {
  resolve: (value?: unknown) => void
  reject: () => void
  options?: SyncOptions
}
