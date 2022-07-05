import { SyncEvent } from './SyncEvent'

export type SyncEventReceiver = (event: SyncEvent) => void
